import k8s from "@kubernetes/client-node";
import { getClusterRecord, getK8SResource } from "./util.js";
import helper from "../util/helper.js";

// Kubernetes client configuration
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sNetworkingApi = kc.makeApiClient(k8s.NetworkingV1Api);

// Definition is networking
export async function createIngress(definition, name, namespace) {
	if (definition.ingress.type === "path")
		await createPathIngress(definition, name, namespace);
	else await createSubDomainIngress(definition, name, namespace);
}

// Definition is networking
export async function createPathIngress(definition, name, namespace) {
	// Get cluster info from the database
	const cluster = await getClusterRecord();

	const ingress = {
		apiVersion: "networking.k8s.io/v1",
		kind: "Ingress",
		metadata: {
			name: `${name}-path`,
			namespace: namespace,
			annotations: {
				"nginx.ingress.kubernetes.io/proxy-body-size": "500m",
				"nginx.ingress.kubernetes.io/proxy-connect-timeout": "6000",
				"nginx.ingress.kubernetes.io/proxy-send-timeout": "6000",
				"nginx.ingress.kubernetes.io/proxy-read-timeout": "6000",
				"nginx.ingress.kubernetes.io/proxy-next-upstream-timeout": "6000",
				"nginx.ingress.kubernetes.io/rewrite-target": "/$2",
			},
		},
		spec: {
			ingressClassName: "nginx",
			rules: [
				{
					http: {
						paths: [
							{
								path: `/${name}-${namespace}(/|$)(.*)`,
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

	// If cluster has SSL settings and custom domains then also add these to the API server ingress
	if (cluster) {
		if (cluster.enforceSSLAccess) {
			ingress.metadata.annotations["nginx.ingress.kubernetes.io/ssl-redirect"] =
				"true";
			ingress.metadata.annotations[
				"nginx.ingress.kubernetes.io/force-ssl-redirect"
			] = "true";
		} else {
			ingress.metadata.annotations["nginx.ingress.kubernetes.io/ssl-redirect"] =
				"false";
			ingress.metadata.annotations[
				"nginx.ingress.kubernetes.io/force-ssl-redirect"
			] = "false";
		}

		if (cluster.domains.length > 0) {
			ingress.metadata.annotations["cert-manager.io/cluster-issuer"] =
				"agnost-letsencrypt-clusterissuer";
			ingress.metadata.annotations["kubernetes.io/ingress.class"] = "nginx";

			ingress.spec.tls = cluster.domains.map((domainName) => {
				const secretName = domainName.replaceAll(".", "-") + "-path-tls";
				return {
					hosts: [domainName],
					secretName: secretName,
				};
			});

			for (const domainName of cluster.domains) {
				ingress.spec.rules.unshift({
					host: domainName,
					http: {
						paths: [
							{
								path: `/${name}-${namespace}(/|$)(.*)`,
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
		}
	}

	try {
		// Create the ingress with the provided spec
		await k8sNetworkingApi.createNamespacedIngress(namespace, ingress);
		console.info(
			`Ingress '${name}-path' in namespace '${namespace}' created successfully`
		);
	} catch (err) {
		console.error(
			`Ingress '${name}-path' in namespace '${namespace}' cannot be created. ${
				err.response?.body?.message ?? err.message
			}`
		);
		throw err;
	}
}

// Definition is networking
export async function createSubDomainIngress(definition, name, namespace) {
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
			},
		},
		spec: {
			ingressClassName: "nginx",
			rules: [],
		},
	};

	// If cluster has SSL settings and custom domains then also add these to the API server ingress
	if (cluster.enforceSSLAccess) {
		ingress.metadata.annotations["nginx.ingress.kubernetes.io/ssl-redirect"] =
			"true";
		ingress.metadata.annotations[
			"nginx.ingress.kubernetes.io/force-ssl-redirect"
		] = "true";
	} else {
		ingress.metadata.annotations["nginx.ingress.kubernetes.io/ssl-redirect"] =
			"false";
		ingress.metadata.annotations[
			"nginx.ingress.kubernetes.io/force-ssl-redirect"
		] = "false";
	}

	ingress.metadata.annotations["cert-manager.io/cluster-issuer"] =
		"agnost-letsencrypt-clusterissuer";
	ingress.metadata.annotations["kubernetes.io/ingress.class"] = "nginx";

	ingress.spec.tls = cluster.domains.map((domainName) => {
		const secretName = domainName.replaceAll(".", "-") + "-subdomain-tls";
		return {
			hosts: [`${name}-${namespace}.${domainName}`],
			secretName: secretName,
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

// Definition is networking
export async function updateIngress(
	definition,
	name,
	namespace,
	isTypeChanged = false
) {
	if (definition.ingress.enabled) {
		const payload = await getK8SResource(
			"Ingress",
			`${name}-${definition.ingress.type === "path" ? "path" : "subdomain"}`,
			namespace
		);
		if (!payload) {
			await createIngress(definition, name, namespace);
			return;
		} else {
			if (isTypeChanged) {
				// If the new type is path then we delete the subdomain ingress and create a new path ingress and vice versa
				await deleteIngress(
					`${name}-${
						definition.ingress.type === "path" ? "subdomain" : "path"
					}`,
					namespace
				);
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
					`${name}-${
						definition.ingress.type === "path" ? "path" : "subdomain"
					}`,
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
					`Ingress '${name}-cluster' in namespace '${namespace}' updated successfully`
				);
			}
		}
	} else {
		await deleteIngress(
			`${name}-${definition.ingress.type === "path" ? "path" : "subdomain"}`,
			namespace
		);
		return;
	}
}

export async function deleteIngress(name, namespace) {
	if (!(await getK8SResource("Ingress", name, namespace))) return;

	try {
		await k8sNetworkingApi.deleteNamespacedIngress(name, namespace);
		console.info(
			`Ingress '${name}' in namespace ${namespace} deleted successfully`
		);
	} catch (err) {
		console.error(
			`Error deleting ingress '${name}' in namespace ${namespace}. ${
				err.response?.body?.message ?? err.message
			}`
		);
	}
}

// Definition is networking
export async function createCustomDomainIngress(definition, name, namespace) {
	// Get cluster info from the database
	const cluster = await getClusterRecord();
	const secretName =
		definition.customDomain.domain.replaceAll(".", "-") + "-domain-tls";

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
			},
		},
		spec: {
			ingressClassName: "nginx",
			tls: [
				{
					hosts: [definition.customDomain.domain],
					secretName: secretName,
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

	if (cluster.enforceSSLAccess) {
		ingress.metadata.annotations["nginx.ingress.kubernetes.io/ssl-redirect"] =
			"true";
		ingress.metadata.annotations[
			"nginx.ingress.kubernetes.io/force-ssl-redirect"
		] = "true";
	} else {
		ingress.metadata.annotations["nginx.ingress.kubernetes.io/ssl-redirect"] =
			"false";
		ingress.metadata.annotations[
			"nginx.ingress.kubernetes.io/force-ssl-redirect"
		] = "false";
	}

	ingress.metadata.annotations["cert-manager.io/cluster-issuer"] =
		"agnost-letsencrypt-clusterissuer";
	ingress.metadata.annotations["kubernetes.io/ingress.class"] = "nginx";

	// Create the ingress with the provided spec
	await k8sNetworkingApi.createNamespacedIngress(namespace, ingress);
	console.info(
		`Ingress '${name}-domain' in namespace '${namespace}' created successfully`
	);
}

// Definition is networking
export async function updateCustomDomainIngress(
	definition,
	name,
	namespace,
	isDomainNameChanged = false
) {
	if (definition.customDomain.enabled) {
		const payload = await getK8SResource(
			"Ingress",
			`${name}-domain`,
			namespace
		);
		if (!payload) {
			await createCustomDomainIngress(definition, name, namespace);
			return;
		} else {
			if (isDomainNameChanged) {
				await deleteCustomDomainIngress(`${name}-domain`, namespace);
				await createCustomDomainIngress(definition, name, namespace);
				return;
			} else {
				// Update the ingress
				const { spec } = payload.body;
				spec.tls[0].hosts = [definition.customDomain.domain];
				spec.rules = spec.rules.map((entry) => {
					entry.host = definition.customDomain.domain;
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
		await deleteIngress(`${name}-domain`, namespace);
		return;
	}
}

export async function deleteCustomDomainIngress(name, namespace) {
	if (!(await getK8SResource("Ingress", name, namespace))) return;

	try {
		await k8sNetworkingApi.deleteNamespacedIngress(name, namespace);
		console.info(
			`Ingress '${name}' in namespace ${namespace} deleted successfully`
		);
	} catch (err) {
		console.error(
			`Error deleting ingress '${name}' in namespace ${namespace}. ${
				err.response?.body?.message ?? err.message
			}`
		);
	}
}

/**
 * Adds the cluster domain to the ingresses of the specified containers (platform and sync).
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
			// We are adding this rule to the top of the list so that it gets precedence over other rules
			ingress.body.spec.rules.unshift({
				host: domain,
				http: {
					paths: [
						{
							// If he container has a custom path then use it, otherwise use the container iid and namespace concatenated
							path: `/${
								ingressPath ?? container.iid + "-" + namespace
							}(/|$)(.*)`,
							pathType: "Prefix",
							backend: {
								service: {
									name: `${container.iid}`,
									port: { number: containerPort },
								},
							},
						},
					],
				},
			});

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
 * Deletes custom domains from a cluster container's ingress (platform or sync).
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
			ingress.body.spec.tls = ingress.body.spec.tls.filter(
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

			// Remove the domain entry from ingress rules
			ingress.body.spec.rules = ingress.body.spec.rules.filter(
				(rule) => rule.host !== domain
			);

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
