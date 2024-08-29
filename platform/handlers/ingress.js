import k8s from "@kubernetes/client-node";
import psl from "psl";
import { getClusterRecord, getK8SResource } from "./util.js";
import {
	createCertificateIssuerForDNS01,
	deleteCertificateIssuerForDNS01,
	deleteCertificate,
} from "./certificate.js";

// Kubernetes client configuration
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sNetworkingApi = kc.makeApiClient(k8s.NetworkingV1Api);

/**
 * Creates an Ingress resource (subdomain of cluster domain) in Kubernetes.
 * @param {Object} definition - The definition object.
 * @param {string} name - The name of the Ingress.
 * @param {string} namespace - The namespace in which to create the Ingress.
 * @returns {Promise<void>} - A promise that resolves when the Ingress is created successfully.
 * @throws {Error} - If the Ingress cannot be created.
 */
export async function createIngress(definition, name, namespace) {
	// Get cluster info from the database
	const cluster = await getClusterRecord();
	// If cluster has no domains then return
	if (!cluster || !cluster.domains || cluster.domains.length === 0) return;

	const ingress = {
		apiVersion: "networking.k8s.io/v1",
		kind: "Ingress",
		metadata: {
			name: `${name}-subdomain`,
			namespace: namespace,
			annotations: {
				"nginx.ingress.kubernetes.io/proxy-body-size": "500m",
				"nginx.ingress.kubernetes.io/proxy-connect-timeout": "6000",
				"nginx.ingress.kubernetes.io/proxy-send-timeout": "6000",
				"nginx.ingress.kubernetes.io/proxy-read-timeout": "6000",
				"nginx.ingress.kubernetes.io/proxy-next-upstream-timeout": "6000",
				"nginx.ingress.kubernetes.io/ssl-redirect": "true",
				"nginx.ingress.kubernetes.io/force-ssl-redirect": "true",
				"kubernetes.io/ingress.class": "nginx",
			},
		},
		spec: {
			rules: [],
		},
	};

	// We do not specify the secret name here, so that ingress-controller will use the default certificate which is the agnost-cluster-tls valid for root and wildcard domains
	ingress.spec.tls = cluster.domains.map((domainName) => {
		return {
			hosts: [`${name}-${namespace}.${domainName}`],
		};
	});

	for (const domainName of cluster.domains) {
		ingress.spec.rules.unshift({
			host: `${name}-${namespace}.${domainName}`,
			http: {
				paths: [
					{
						path: "/",
						pathType: "Prefix",
						backend: {
							service: {
								name: `${name}`,
								port: { number: definition.containerPort },
							},
						},
					},
				],
			},
		});
	}

	try {
		// Create the ingress with the provided spec
		await k8sNetworkingApi.createNamespacedIngress(namespace, ingress);
		console.info(
			`Ingress '${name}-subdomain' in namespace '${namespace}' created successfully`
		);
	} catch (err) {
		console.error(
			`Ingress '${name}-subdomain' in namespace '${namespace}' cannot be created. ${
				err.response?.body?.message ?? err.message
			}`
		);
		throw err;
	}
}

/**
 * Updates the Ingress resource (subdomain of cluster domain) based on the provided definition, name, and namespace.
 * @param {Object} definition - The definition object containing the configuration for the Ingress.
 * @param {string} name - The name of the Ingress.
 * @param {string} namespace - The namespace of the Ingress.
 * @returns {Promise<void>} - A Promise that resolves when the Ingress is updated successfully.
 */
export async function updateIngress(definition, name, namespace) {
	if (definition.ingress.enabled) {
		const payload = await getK8SResource(
			"Ingress",
			`${name}-subdomain`,
			namespace
		);

		if (!payload) {
			await createIngress(definition, name, namespace);
			return;
		} else {
			// Update the ingress
			const { spec } = payload.body;
			spec.rules = spec.rules.map((entry) => {
				entry.http.paths = entry.http.paths.map((path) => {
					path.backend.service.port.number = definition.containerPort;
					return path;
				});

				return entry;
			});

			const requestOptions = {
				headers: { "Content-Type": "application/merge-patch+json" },
			};
			await k8sNetworkingApi.replaceNamespacedIngress(
				`${name}-subdomain`,
				namespace,
				payload.body,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				requestOptions
			);

			console.info(
				`Ingress ${name}-subdomain' in namespace '${namespace}' updated successfully`
			);
		}
	} else {
		await deleteIngress(name, namespace);
		return;
	}
}

/**
 * Deletes an Ingress resource (subdomain of cluster domain) in the specified namespace.
 *
 * @param {string} name - The name of the Ingress resource.
 * @param {string} namespace - The namespace of the Ingress resource.
 * @returns {Promise<void>} - A Promise that resolves when the Ingress resource is deleted successfully.
 */
export async function deleteIngress(name, namespace) {
	if (!(await getK8SResource("Ingress", `${name}-subdomain`, namespace)))
		return;

	try {
		await k8sNetworkingApi.deleteNamespacedIngress(
			`${name}-subdomain`,
			namespace
		);
		console.info(
			`Ingress '${name}-subdomain' in namespace ${namespace} deleted successfully`
		);
	} catch (err) {
		console.error(
			`Error deleting ingress '${name}-subdomain' in namespace ${namespace}. ${
				err.response?.body?.message ?? err.message
			}`
		);
	}
}

/**
 * Creates a custom domain ingress.
 * @param {Object} definition - The definition object.
 * @param {string} name - The name of the ingress.
 * @param {string} namespace - The namespace of the ingress.
 * @param {string} slug - The slug of the ingress.
 * @returns {Promise<void>} - A promise that resolves when the ingress is created successfully.
 */
export async function createCustomDomainIngress(
	definition,
	name,
	namespace,
	slug
) {
	// Set the issuer of the certifiate
	const isWildcard = definition.customDomain.domain.startsWith("*");

	// If wildward then it cannot be a root domain
	const isRootDomainFlag = isWildcard
		? false
		: isRootDomain(definition.customDomain.domain);

	let hosts = [];
	if (isWildcard) {
		hosts = [definition.customDomain.domain];
	} else {
		// For root domains we also generate certificate for www subdomain
		if (isRootDomainFlag)
			hosts = [
				definition.customDomain.domain,
				`www.${definition.customDomain.domain}`,
			];
		else hosts = [definition.customDomain.domain];
	}

	const ingress = {
		apiVersion: "networking.k8s.io/v1",
		kind: "Ingress",
		metadata: {
			name: `${name}-domain`,
			namespace: namespace,
			annotations: {
				"nginx.ingress.kubernetes.io/proxy-body-size": "500m",
				"nginx.ingress.kubernetes.io/proxy-connect-timeout": "6000",
				"nginx.ingress.kubernetes.io/proxy-send-timeout": "6000",
				"nginx.ingress.kubernetes.io/proxy-read-timeout": "6000",
				"nginx.ingress.kubernetes.io/proxy-next-upstream-timeout": "6000",
				"nginx.ingress.kubernetes.io/ssl-redirect": "true",
				"nginx.ingress.kubernetes.io/force-ssl-redirect": "true",
				"kubernetes.io/ingress.class": "nginx",
			},
		},
		spec: {
			tls: [
				{
					hosts: hosts,
					secretName: `${name}-tls`,
				},
			],
			rules: [
				{
					host: definition.customDomain.domain,
					http: {
						paths: [
							{
								path: "/",
								pathType: "Prefix",
								backend: {
									service: {
										name: `${name}`,
										port: { number: definition.containerPort },
									},
								},
							},
						],
					},
				},
			],
		},
	};

	if (isWildcard) {
		// In case of wildcard domain we need to create the issuer with DNS01 solver
		// Create the namespace scoped issuer
		await createCertificateIssuerForDNS01(name, namespace, slug);
		// Assign issuer as annotation
		ingress.metadata.annotations["cert-manager.io/issuer"] = name;
	} else {
		// We are also adding a rule for www subdomain in case of root domain
		if (isRootDomainFlag) {
			ingress.spec.rules.push({
				host: `www.${definition.customDomain.domain}`,
				http: {
					paths: [
						{
							path: "/",
							pathType: "Prefix",
							backend: {
								service: {
									name: `${name}`,
									port: { number: definition.containerPort },
								},
							},
						},
					],
				},
			});
		}

		// In case of non-wildcard domain we can use the default cluster scoped http01 solver
		ingress.metadata.annotations["cert-manager.io/cluster-issuer"] =
			"agnost-http01";
	}

	// Create the ingress with the provided spec
	await k8sNetworkingApi.createNamespacedIngress(namespace, ingress);
	console.info(
		`Ingress '${name}-domain' in namespace '${namespace}' created successfully`
	);
}

/**
 * Updates the custom domain ingress based on the provided parameters.
 * @param {Object} definition - The definition object containing the custom domain configuration.
 * @param {string} name - The name of the custom domain ingress.
 * @param {string} namespace - The namespace of the custom domain ingress.
 * @param {string} slug - The slug of the custom domain ingress.
 * @param {boolean} [isDomainNameChanged=false] - Indicates whether the domain name has changed.
 * @returns {Promise<void>} - A promise that resolves when the custom domain ingress is updated.
 */
export async function updateCustomDomainIngress(
	definition,
	name,
	namespace,
	slug,
	isDomainNameChanged = false
) {
	if (definition.customDomain.enabled) {
		const payload = await getK8SResource(
			"Ingress",
			`${name}-domain`,
			namespace
		);
		if (!payload) {
			await createCustomDomainIngress(definition, name, namespace, slug);
			return;
		} else {
			if (isDomainNameChanged) {
				await deleteCustomDomainIngress(name, namespace);
				await createCustomDomainIngress(definition, name, namespace, slug);
				return;
			} else {
				// Update the ingress
				const { spec } = payload.body;
				spec.rules = spec.rules.map((entry) => {
					entry.http.paths = entry.http.paths.map((path) => {
						path.backend.service.port.number = definition.containerPort;
						return path;
					});

					return entry;
				});

				const requestOptions = {
					headers: { "Content-Type": "application/merge-patch+json" },
				};
				await k8sNetworkingApi.replaceNamespacedIngress(
					`${name}-domain`,
					namespace,
					payload.body,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					requestOptions
				);

				console.info(
					`Ingress '${name}-domain' in namespace '${namespace}' updated successfully`
				);
			}
		}
	} else {
		await deleteCustomDomainIngress(name, namespace);
		return;
	}
}

/**
 * Deletes the custom domain ingress.
 * @param {string} name - The name of the custom domain.
 * @param {string} namespace - The namespace of the custom domain.
 * @returns {Promise<void>} - A promise that resolves when the ingress is deleted successfully.
 */
export async function deleteCustomDomainIngress(name, namespace) {
	if (!(await getK8SResource("Ingress", `${name}-domain`, namespace))) return;

	try {
		// Delete the certificate resources associated with the custom domain
		await deleteCertificate(`${name}-tls`, namespace);
		await k8sNetworkingApi.deleteNamespacedIngress(`${name}-domain`, namespace);
		console.info(
			`Ingress '${name}-domain' in namespace ${namespace} deleted successfully`
		);
		try {
			// In case of wildcard domain we need to delete the issuer with DNS01 solver, if it exists
			await deleteCertificateIssuerForDNS01(name, namespace);
		} catch (err) {}
	} catch (err) {
		console.error(
			`Error deleting ingress '${name}-domain' in namespace ${namespace}. ${
				err.response?.body?.message ?? err.message
			}`
		);
	}
}

/**
 * Adds the cluster domain to the ingresses of the specified containers (platform and sync). Only applicable for platform containers, not the containers created by the platform users.
 * @param {Array} containers - The containers to update the ingresses for.
 * @param {string} domain - The cluster domain to add.
 * @returns {Promise<void>} - A promise that resolves when all ingresses have been updated.
 */
export async function addClusterDomainToIngresses(containers, domain) {
	if (containers?.length === 0) return;
	for (const container of containers) {
		const ingressPath = container.networking.ingress.path;
		const containerPort = container.networking.containerPort;
		const namespace = container.environmentId.iid;

		try {
			const ingress = await getK8SResource(
				"Ingress",
				`${container.iid}`,
				namespace
			);
			if (!ingress) return;

			ingress.body.metadata.annotations[
				"nginx.ingress.kubernetes.io/ssl-redirect"
			] = "true";
			ingress.body.metadata.annotations[
				"nginx.ingress.kubernetes.io/force-ssl-redirect"
			] = "true";

			ingress.body.metadata.annotations["kubernetes.io/ingress.class"] =
				"nginx";

			if (!ingress.body.spec.tls) ingress.body.spec.tls = [];

			// We are not specifying the secret name here, so that ingress-controller will use the default certificate which is the agnost-cluster-tls valid for root and wildcard domains
			ingress.body.spec.tls.push({
				hosts: [domain],
			});

			ingress.body.spec.rules = ingress.body.spec.rules ?? [];

			let paths = [];
			if (ingressPath === "studio") {
				paths = [
					{
						// If he container has a custom path then use it, otherwise use the container iid and namespace concatenated
						path: `/${ingressPath ?? container.iid + "-" + namespace}(/|$)(.*)`,
						pathType: "Prefix",
						backend: {
							service: {
								name: `${container.iid}`,
								port: { number: containerPort },
							},
						},
					},
					{
						path: "/",
						pathType: "Prefix",
						backend: {
							service: {
								name: `${container.iid}`,
								port: { number: containerPort },
							},
						},
					},
				];
			} else {
				paths = [
					{
						// If he container has a custom path then use it, otherwise use the container iid and namespace concatenated
						path: `/${ingressPath ?? container.iid + "-" + namespace}/(.*)`,
						pathType: "ImplementationSpecific",
						backend: {
							service: {
								name: `${container.iid}`,
								port: { number: containerPort },
							},
						},
					},
				];
			}

			// Assign new rules to the ingress
			ingress.body.spec.rules = [
				{
					host: domain,
					http: {
						paths: paths,
					},
				},
			];

			const requestOptions = {
				headers: { "Content-Type": "application/merge-patch+json" },
			};
			await k8sNetworkingApi.patchNamespacedIngress(
				`${container.iid}`,
				namespace,
				ingress.body,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				requestOptions
			);

			console.info(
				`Added cluster domain '${domain}' entry to ingress '${container.iid}' at namespace ${namespace}.`
			);
		} catch (err) {
			console.error(
				`Cannot add cluster domain '${domain}' to ingress '${
					container.iid
				}' at namespace ${namespace}. ${
					err.response?.body?.message ?? err.message
				}`
			);
		}
	}
}

/**
 * Removes the specified domain from the ingress resources (platform and sync) associated with the given containers.
 * @param {Array<Object>} containers - The containers to remove the domain from.
 * @param {string} domain - The domain to be removed.
 * @returns {Promise<void>} - A promise that resolves when the domain has been removed from all ingress resources.
 */
export async function removeClusterDomainFromIngresses(containers, domain) {
	if (containers?.length === 0) return;
	for (const container of containers) {
		const namespace = container.environmentId.iid;
		try {
			const ingress = await getK8SResource(
				"Ingress",
				`${container.iid}`,
				namespace
			);

			if (!ingress) return;

			// Remove tls entry associated with the domain
			ingress.body.spec.tls = ingress.body.spec.tls?.filter(
				(tls) => tls.hosts[0] !== domain
			);

			// If we do not have any tls entry left then delete ssl related annotations
			if (ingress.body.spec.tls.length === 0) {
				delete ingress.body.spec.tls;
				delete ingress.body.metadata.annotations[
					"nginx.ingress.kubernetes.io/ssl-redirect"
				];
				delete ingress.body.metadata.annotations[
					"nginx.ingress.kubernetes.io/force-ssl-redirect"
				];
			}

			// Remove the host value from ingress rules
			ingress.body.spec.rules = ingress.body.spec.rules?.map((rule) => {
				delete rule.host;
				return rule;
			});

			const requestOptions = {
				headers: { "Content-Type": "application/merge-patch+json" },
			};
			await k8sNetworkingApi.replaceNamespacedIngress(
				`${container.iid}`,
				namespace,
				ingress.body,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				requestOptions
			);

			console.info(
				`Removed cluster domain '${domain}' entry from ingress '${container.iid}' at namespace ${namespace}.`
			);
		} catch (err) {
			console.error(
				`Cannot remove cluster domain '${domain}' from ingress '${
					container.iid
				}' at namespace ${namespace}. ${
					err.response?.body?.message ?? err.message
				}`
			);
		}
	}
}

/**
 * Checks if the given domain is a root domain.
 *
 * @param {string} domain - The domain to check.
 * @returns {boolean} Returns true if the domain is a root domain, false otherwise.
 */
export function isRootDomain(domain) {
	const parsedDomain = psl.parse(domain);

	// Check if the domain has only a TLD and SLD
	if (parsedDomain && parsedDomain.domain === domain) {
		return true;
	}

	return false;
}
