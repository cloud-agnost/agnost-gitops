import k8s from "@kubernetes/client-node";
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
 * Initializes the certificate issuer available across all namespaces for DNS01 challenge which will be used to issue certificates for wildcard domains.
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
											endpoint: `https://agnost-webhook.${process.env.NAMESPACE}.svc.cluster.local:443`,
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
 * Creates certificate for the cluster's root domain and wildcard domain.
 * Uses different cluster issuers for each challenge type.
 * @param {string} domain - The domain for which the certificate is created.
 * @returns {Promise<void>} - A promise that resolves when the certificates are created successfully.
 */
export async function createClusterDomainCertificates(domain) {
	// Create the certificate for the root and wildcard domain
	const secretName = "agnost-cluster-tls";
	const clusterDomainCertificate = {
		apiVersion: "cert-manager.io/v1",
		kind: "Certificate",
		metadata: {
			name: "agnost-cluster-tls",
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
		console.log(
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
 * Deletes the cluster domain certificates.
 * @returns {Promise<void>} A promise that resolves when the certificates are deleted.
 */
export async function deleteClusterDomainCertificates() {
	await deleteCertificateResources("agnost-cluster-tls", process.env.NAMESPACE);
}

/**
 * Deletes the resources associated with a certificate.
 * @param {string} certificateName - The name of the certificate to delete.
 * @param {string} namespace - The namespace of the certificate.
 * @returns {Promise<void>} - A promise that resolves when the resources are deleted.
 */
export async function deleteCertificateResources(certificateName, namespace) {
	try {
		// Get the list of certificates
		const certificates = await k8sCustomObjectApi.listNamespacedCustomObject(
			"cert-manager.io",
			"v1",
			namespace,
			"certificates"
		);

		for (const cert of certificates.body.items) {
			if (cert.metadata.name === certificateName) {
				try {
					await k8sCustomObjectApi.deleteNamespacedCustomObject(
						"cert-manager.io",
						"v1",
						namespace,
						"certificates",
						certificateName
					);

					console.log(`Deleted certificate ${certificateName}.`);
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
			if (certReq.metadata.name.startsWith(certificateName)) {
				try {
					await k8sCustomObjectApi.deleteNamespacedCustomObject(
						"cert-manager.io",
						"v1",
						namespace,
						"certificaterequests",
						certReq.metadata.name
					);
					console.log(`Deleted certificaterequest ${certReq.metadata.name}.`);
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
			if (order.metadata.name.startsWith(certificateName)) {
				try {
					await k8sCustomObjectApi.deleteNamespacedCustomObject(
						"acme.cert-manager.io",
						"v1",
						namespace,
						"orders",
						order.metadata.name
					);
					console.log(`Deleted order ${order.metadata.name}.`);
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
			if (challenge.metadata.name.startsWith(certificateName)) {
				try {
					await k8sCustomObjectApi.deleteNamespacedCustomObject(
						"acme.cert-manager.io",
						"v1",
						namespace,
						"challenges",
						challenge.metadata.name
					);
					console.log(`Deleted challenge ${challenge.metadata.name}.`);
				} catch {}
			}
		}
	} catch (err) {
		console.error(
			`Cannot delete cluster level domain certificate ${certificateName}. ${
				err.response?.body?.message ?? err.message
			}`
		);
	}
}
