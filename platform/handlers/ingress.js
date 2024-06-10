import k8s from "@kubernetes/client-node";
import { getClusterRecord, getK8SResource } from "./util.js";
import helper from "../util/helper.js";

// Kubernetes client configuration
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sNetworkingApi = kc.makeApiClient(k8s.NetworkingV1Api);

// Definition is networking
export async function createIngress(definition, name, namespace) {
	// Get cluster info from the database
	const cluster = await getClusterRecord();

	const ingress = {
		apiVersion: "networking.k8s.io/v1",
		kind: "Ingress",
		metadata: {
			name: `${name}-cluster`,
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
				"letsencrypt-clusterissuer";
			ingress.metadata.annotations["kubernetes.io/ingress.class"] = "nginx";

			ingress.spec.tls = cluster.domains.map((domainName) => {
				const secretName = helper.getCertSecretName();
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
			`Ingress '${name}-cluster' in namespace '${namespace}' created successfully`
		);
	} catch (err) {
		console.error(
			`Ingress '${name}-cluster' in namespace '${namespace}' cannot be created. ${
				err.response?.body?.message ?? err.message
			}`
		);
		throw err;
	}
}

// Definition is networking
export async function updateIngress(
	definition,
	isContainerPortChanged,
	name,
	namespace
) {
	if (definition.ingress.enabled) {
		const payload = await getK8SResource(
			"Ingress",
			`${name}-cluster`,
			namespace
		);
		if (!payload) {
			await createIngress(definition, name, namespace);
			return;
		} else if (isContainerPortChanged) {
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
				`${name}-cluster`,
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
	} else {
		await deleteIngress(`${name}-cluster`, namespace);
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
					secretName: helper.getCertSecretName(),
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
		"letsencrypt-clusterissuer";
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
	isContainerPortChanged,
	isCustomDomainChanged,
	name,
	namespace
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
		} else if (isContainerPortChanged || isCustomDomainChanged) {
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
 * Adds a custom domain to a container ingress.
 */
export async function addClusterCustomDomain(
	containeriid,
	namespace,
	domainName,
	containerPort,
	enforceSSLAccess
) {
	try {
		const ingress = await getK8SResource(
			"Ingress",
			`${containeriid}-cluster`,
			namespace
		);
		if (!ingress) return;

		if (enforceSSLAccess) {
			ingress.body.metadata.annotations[
				"nginx.ingress.kubernetes.io/ssl-redirect"
			] = "true";
			ingress.body.metadata.annotations[
				"nginx.ingress.kubernetes.io/force-ssl-redirect"
			] = "true";
		} else {
			ingress.body.metadata.annotations[
				"nginx.ingress.kubernetes.io/ssl-redirect"
			] = "false";
			ingress.body.metadata.annotations[
				"nginx.ingress.kubernetes.io/force-ssl-redirect"
			] = "false";
		}

		ingress.body.metadata.annotations["cert-manager.io/cluster-issuer"] =
			"letsencrypt-clusterissuer";
		ingress.body.metadata.annotations["kubernetes.io/ingress.class"] = "nginx";

		if (ingress.body.spec.tls) {
			ingress.body.spec.tls.push({
				hosts: [domainName],
				secretName: helper.getCertSecretName(),
			});
		} else {
			ingress.body.spec.tls = [
				{
					hosts: [domainName],
					secretName: helper.getCertSecretName(),
				},
			];
		}

		ingress.body.spec.rules = ingress.body.spec.rules ?? [];
		ingress.body.spec.rules.unshift({
			host: domainName,
			http: {
				paths: [
					{
						path: `/${containeriid}-${namespace}(/|$)(.*)`,
						pathType: "Prefix",
						backend: {
							service: {
								name: `${containeriid}`,
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
			`${containeriid}-cluster`,
			namespace,
			ingress.body,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			requestOptions
		);
	} catch (err) {
		console.error(
			`Cannot add custom domain '${domainName}' to ingress '${containeriid}-cluster'`,
			{ details: err }
		);
	}
}

/**
 * Deletes custom domains from a container's ingress.
 */
export async function deleteClusterCustomDomains(
	containeriid,
	namespace,
	domainNames
) {
	try {
		const ingress = await getK8SResource(
			"Ingress",
			`${containeriid}-cluster`,
			namespace
		);
		if (!ingress) return;

		// Remove tls entry
		ingress.body.spec.tls = ingress.body.spec.tls.filter(
			(tls) => !domainNames.includes(tls.hosts[0])
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
			delete ingress.body.metadata.annotations[
				"cert-manager.io/cluster-issuer"
			];
		}

		// Update rules
		ingress.body.spec.rules = ingress.body.spec.rules.filter(
			(rule) => !domainNames.includes(rule.host)
		);

		const requestOptions = {
			headers: { "Content-Type": "application/merge-patch+json" },
		};
		await k8sNetworkingApi.replaceNamespacedIngress(
			`${containeriid}-cluster`,
			namespace,
			ingress.body,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			requestOptions
		);
	} catch (err) {
		console.error(
			`Cannot remove custom domain(s) '${domainNames.join(
				", "
			)}' to ingress '${containeriid}-cluster'`,
			{
				details: err,
			}
		);
	}
}

/**
 * Updates the enforceSSLAccess settings for the specified ingress.
 */
export async function updateEnforceSSLAccessSettings(
	ingressName,
	namespace,
	enforceSSLAccess = false
) {
	try {
		const ingress = await getK8SResource("Ingress", ingressName, namespace);
		if (!ingress) return;

		if (enforceSSLAccess) {
			ingress.body.metadata.annotations[
				"nginx.ingress.kubernetes.io/ssl-redirect"
			] = "true";
			ingress.body.metadata.annotations[
				"nginx.ingress.kubernetes.io/force-ssl-redirect"
			] = "true";
		} else {
			ingress.body.metadata.annotations[
				"nginx.ingress.kubernetes.io/ssl-redirect"
			] = "false";
			ingress.body.metadata.annotations[
				"nginx.ingress.kubernetes.io/force-ssl-redirect"
			] = "false";
		}

		ingress.body.metadata.annotations["cert-manager.io/cluster-issuer"] =
			"letsencrypt-clusterissuer";
		ingress.body.metadata.annotations["kubernetes.io/ingress.class"] = "nginx";

		const requestOptions = {
			headers: { "Content-Type": "application/merge-patch+json" },
		};
		await k8sNetworkingApi.patchNamespacedIngress(
			ingressName,
			namespace,
			ingress.body,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			requestOptions
		);
	} catch (err) {
		console.error(
			`Cannot update ssl access settings of ingress '${ingressName}'`,
			{ details: err }
		);
	}
}
