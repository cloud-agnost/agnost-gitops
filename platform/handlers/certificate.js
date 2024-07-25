import k8s from "@kubernetes/client-node";
import config from "config";
import { getNginxIngressControllerDeployment } from "./util.js";

// Create a Kubernetes core API client
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
const k8sCustomObjectApi = kc.makeApiClient(k8s.CustomObjectsApi);

/**
 * Initializes the certificate issuer available across all namespaces for HTTP01 challenge which is used for root domains.
 * This function checks if the certificate issuer already exists, and if not, creates it.
 * @returns {Promise<void>} A promise that resolves when the initialization is complete.
 */
export async function initializeClusterCertificateIssuerForHTTP01() {
	try {
		// Check to see if we have the certificate issuer already
		await k8sCustomObjectApi.getClusterCustomObject(
			"cert-manager.io",
			"v1",
			"clusterissuers",
			"agnost-http01"
		);

		return;
	} catch (err) {
		// If we get a 404, we need to create the issuer
		if (err.statusCode === 404) {
			const clusterIssuer = {
				apiVersion: "cert-manager.io/v1",
				kind: "ClusterIssuer",
				metadata: {
					name: "agnost-http01",
				},
				spec: {
					acme: {
						privateKeySecretRef: {
							name: "agnost-http01-key",
						},
						server: "https://acme-v02.api.letsencrypt.org/directory",
						solvers: [
							{
								http01: {
									ingress: {
										class: "nginx",
									},
								},
							},
						],
					},
				},
			};

			try {
				await k8sCustomObjectApi.createClusterCustomObject(
					"cert-manager.io",
					"v1",
					"clusterissuers",
					clusterIssuer
				);
			} catch (err) {
				console.error(
					`Cannot initialize the cluster level HTT01 challenge certificate issuer. ${
						err.response?.body?.message ?? err.message
					}`
				);
			}

			console.info(
				`Initialized cluster level certificate issuer for HTTP01 challenges.`
			);
		}
	}
}

/**
 * Initializes the certificate issuer for DNS01 challenge which will be used to issue certificate specifically for the cluster domain.
 * This function checks if the certificate issuer already exists, and if not, creates it.
 * @returns {Promise<void>} A promise that resolves when the initialization is complete.
 */
export async function initializeClusterCertificateIssuerForDNS01() {
	try {
		// Check to see if we have the certificate issuer already
		await k8sCustomObjectApi.getClusterCustomObject(
			"cert-manager.io",
			"v1",
			"clusterissuers",
			"agnost-dns01"
		);

		return;
	} catch (err) {
		// If we get a 404, we need to create the issuer
		if (err.statusCode === 404) {
			const clusterIssuer = {
				apiVersion: "cert-manager.io/v1",
				kind: "ClusterIssuer",
				metadata: {
					name: "agnost-dns01",
				},
				spec: {
					acme: {
						privateKeySecretRef: {
							name: "agnost-dns01-key",
						},
						server: "https://acme-v02.api.letsencrypt.org/directory",
						solvers: [
							{
								dns01: {
									webhook: {
										groupName: process.env.GROUP_NAME,
										solverName: process.env.SOLVER_NAME,
										config: {
											endpoint: `https://${process.env.WEBHOOK_SERVICE}.${process.env.WEBHOOK_NAMESPACE}.svc.cluster.local:443`,
											slug: process.env.CLUSTER_SLUG,
										},
									},
								},
							},
						],
					},
				},
			};

			try {
				await k8sCustomObjectApi.createClusterCustomObject(
					"cert-manager.io",
					"v1",
					"clusterissuers",
					clusterIssuer
				);
			} catch (err) {
				console.error(
					`Cannot initialize the cluster level DNS01 challenge certificate issuer. ${
						err.response?.body?.message ?? err.message
					}`
				);
			}

			console.info(
				`Initialized cluster level certificate issuer DNS01 challenges.`
			);
		}
	}
}

/**
 * Creates the certificate issuer available for the specified namespaces for DNS01 challenges which will be used to issue certificates for root and wildcard domains.
 * @param {string} name - The name of the certificate issuer.
 * @param {string} namespace - The namespace where the certificate issuer will be created.
 * @param {string} slug - The slug for the webhook configuration.
 * @returns {Promise<void>} - A promise that resolves when the certificate issuer is created.
 */
export async function createCertificateIssuerForDNS01(name, namespace, slug) {
	try {
		// Check to see if we have the certificate issuer already
		await k8sCustomObjectApi.getNamespacedCustomObject(
			"cert-manager.io",
			"v1",
			namespace,
			"issuers",
			name
		);

		return;
	} catch (err) {
		// If we get a 404, we need to create the issuer
		if (err.statusCode === 404) {
			const issuer = {
				apiVersion: "cert-manager.io/v1",
				kind: "Issuer",
				metadata: {
					name: name,
					namespace: namespace,
				},
				spec: {
					acme: {
						privateKeySecretRef: {
							name: `${name}-tls`,
						},
						server: "https://acme-v02.api.letsencrypt.org/directory",
						solvers: [
							{
								dns01: {
									webhook: {
										groupName: process.env.GROUP_NAME,
										solverName: process.env.SOLVER_NAME,
										config: {
											endpoint: `https://${process.env.WEBHOOK_SERVICE}.${process.env.WEBHOOK_NAMESPACE}.svc.cluster.local:443`,
											slug: slug,
										},
									},
								},
							},
						],
					},
				},
			};

			try {
				await k8sCustomObjectApi.createNamespacedCustomObject(
					"cert-manager.io",
					"v1",
					namespace,
					"issuers",
					issuer
				);
			} catch (err) {
				console.error(
					`Cannot create the DNS01 challenge certificate issuer for ingress ${name} in namespace ${namespace}. ${
						err.response?.body?.message ?? err.message
					}`
				);
			}

			console.info(
				`Created the DNS01 challenge certificate issuer for ingress ${name} in namespace ${namespace}.`
			);
		}
	}
}

/**
 * Deletes a certificate issuer for DNS01 challenge type in provided namespaces if it exists.
 * @param {string} name - The name of the certificate issuer.
 * @param {string} namespace - The namespace of the certificate issuer.
 * @returns {Promise<void>} - A promise that resolves when the certificate issuer is deleted.
 */
export async function deleteCertificateIssuerForDNS01(name, namespace) {
	try {
		await k8sCustomObjectApi.deleteNamespacedCustomObject(
			"cert-manager.io",
			"v1",
			namespace,
			"issuers",
			name
		);

		return;
	} catch {}
}

/**
 * Creates certificate for the cluster's root domain and wildcard domain.
 * Uses different cluster issuers for each challenge type.
 * @param {string} domain - The domain for which the certificate is created.
 * @returns {Promise<void>} - A promise that resolves when the certificates are created successfully.
 */
export async function createClusterDomainCertificate(domain) {
	// Create the certificate for the root and wildcard domain
	const secretName = config.get("general.clusterDomainSecret");
	const clusterDomainCertificate = {
		apiVersion: "cert-manager.io/v1",
		kind: "Certificate",
		metadata: {
			name: secretName,
			namespace: process.env.NAMESPACE,
		},
		spec: {
			secretName: secretName,
			dnsNames: [domain, `*.${domain}`],
			issuerRef: {
				name: "agnost-dns01",
				kind: "ClusterIssuer",
			},
		},
	};

	try {
		await k8sCustomObjectApi.createNamespacedCustomObject(
			"cert-manager.io",
			"v1",
			process.env.NAMESPACE,
			"certificates",
			clusterDomainCertificate
		);
		console.info(
			`Created the cluster domain '${domain}' and '*.${domain}' certificate.`
		);

		// Update the nginx-controller to use the new certificate as the default
		const ingressDeployment = await getNginxIngressControllerDeployment();
		if (ingressDeployment) {
			try {
				// Remove existing entry if any
				ingressDeployment.spec.template.spec.containers[0].args.filter(
					(entry) => !entry.startsWith("--default-ssl-certificate=")
				);

				ingressDeployment.spec.template.spec.containers[0].args.push(
					`--default-ssl-certificate=${process.env.NAMESPACE}/${secretName}`
				);

				await k8sAppsApi.replaceNamespacedDeployment(
					ingressDeployment.metadata.name,
					process.env.NGINX_NAMESPACE,
					ingressDeployment
				);

				console.info(
					`Updated ingress controller to use the cluster domain '${domain}' and '*.${domain}' certificate as the default certificate.`
				);
			} catch (err) {
				console.error(
					`Cannot update ingress-nginx-controller to use the cluster certificate as the default tls certificate. ${
						err.response?.body?.message ?? err.message
					}`
				);
			}
		} else {
			console.error(
				`Cannot retrive the ingress-nginx-controller deployment to patch for default certificate.`
			);
		}

		// Patch the deployment to use the new certificate as the default
	} catch (err) {
		console.error(
			`Cannot create cluster level domain certificates. ${
				err.response?.body?.message ?? err.message
			}`
		);
	}
}

/**
 * Deletes the cluster domain certificate.
 * @returns {Promise<void>} A promise that resolves when the certificates are deleted.
 */
export async function deleteClusterDomainCertificate() {
	const secretName = config.get("general.clusterDomainSecret");
	await deleteCertificate(secretName, process.env.NAMESPACE);
}

/**
 * Creates a certificate for given domains.
 * @param {string} name - The name of the certificate.
 * @param {string} namespace - The namespace where the certificate will be created.
 * @param {string} issuerName - The name of the issuer for the certificate.
 * @param {string[]} domains - An array of domain names for the certificate.
 * @returns {Promise<void>} - A promise that resolves when the certificate is created successfully.
 */
export async function createCertificate(name, namespace, issuerName, domains) {
	const certificate = {
		apiVersion: "cert-manager.io/v1",
		kind: "Certificate",
		metadata: {
			name: name,
			namespace: namespace,
		},
		spec: {
			secretName: `${name}-tls`,
			dnsNames: domains,
			issuerRef: {
				name: issuerName,
				kind: "Issuer",
			},
		},
	};

	try {
		await k8sCustomObjectApi.createNamespacedCustomObject(
			"cert-manager.io",
			"v1",
			namespace,
			"certificates",
			certificate
		);
		console.info(
			`Created the domain '${domains.join(
				", "
			)}' certificate named ${name} in namespace ${namespace}.`
		);
	} catch (err) {
		console.error(
			`Cannot create cluster level domain certificates. ${
				err.response?.body?.message ?? err.message
			}`
		);
	}
}

/**
 * Deletes the resources associated with a certificate.
 * @param {string} name - The name of the certificate to delete.
 * @param {string} namespace - The namespace of the certificate.
 * @returns {Promise<void>} - A promise that resolves when the resources are deleted.
 */
export async function deleteCertificate(name, namespace) {
	try {
		// Get the list of certificates
		const certificates = await k8sCustomObjectApi.listNamespacedCustomObject(
			"cert-manager.io",
			"v1",
			namespace,
			"certificates"
		);

		for (const cert of certificates.body.items) {
			if (cert.metadata.name === name) {
				try {
					await k8sCustomObjectApi.deleteNamespacedCustomObject(
						"cert-manager.io",
						"v1",
						namespace,
						"certificates",
						name
					);

					console.info(`Deleted certificate ${name}.`);
				} catch {}
			}
		}

		// Get the list of certificaterequests
		const certificateRequests =
			await k8sCustomObjectApi.listNamespacedCustomObject(
				"cert-manager.io",
				"v1",
				namespace,
				"certificaterequests"
			);

		for (const certReq of certificateRequests.body.items) {
			if (certReq.metadata.name.startsWith(name)) {
				try {
					await k8sCustomObjectApi.deleteNamespacedCustomObject(
						"cert-manager.io",
						"v1",
						namespace,
						"certificaterequests",
						certReq.metadata.name
					);
					console.info(`Deleted certificaterequest ${certReq.metadata.name}.`);
				} catch {}
			}
		}

		// Get the list of orders
		const orders = await k8sCustomObjectApi.listNamespacedCustomObject(
			"acme.cert-manager.io",
			"v1",
			namespace,
			"orders"
		);

		for (const order of orders.body.items) {
			if (order.metadata.name.startsWith(name)) {
				try {
					await k8sCustomObjectApi.deleteNamespacedCustomObject(
						"acme.cert-manager.io",
						"v1",
						namespace,
						"orders",
						order.metadata.name
					);
					console.info(`Deleted order ${order.metadata.name}.`);
				} catch {}
			}
		}

		// Get the list of challenges
		const challenges = await k8sCustomObjectApi.listNamespacedCustomObject(
			"acme.cert-manager.io",
			"v1",
			namespace,
			"challenges"
		);

		for (const challenge of challenges.body.items) {
			if (challenge.metadata.name.startsWith(name)) {
				try {
					await k8sCustomObjectApi.deleteNamespacedCustomObject(
						"acme.cert-manager.io",
						"v1",
						namespace,
						"challenges",
						challenge.metadata.name
					);
					console.info(`Deleted challenge ${challenge.metadata.name}.`);
				} catch {}
			}
		}
	} catch (err) {
		console.error(
			`Cannot delete cluster level domain certificate ${name}. ${
				err.response?.body?.message ?? err.message
			}`
		);
	}
}
