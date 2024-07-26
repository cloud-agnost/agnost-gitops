import k8s from "@kubernetes/client-node";
import config from "config";
import cntrCtrl from "../controllers/container.js";
import clsCtrl from "../controllers/cluster.js";
import { getNginxIngressControllerDeployment } from "./util.js";
import { addClusterDomainToIngresses } from "./ingress.js";
import { sendMessage } from "../init/sync.js";

// Create a Kubernetes core API client
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
const k8sCustomObjectApi = kc.makeApiClient(k8s.CustomObjectsApi);
// Interval ID for the certificate renewal
let intervalId = null;
// Timeout ID for the certificate renewal
let timeoutId = null;

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

		// Create an interval that runs periodically to check the status of the certificate
		intervalId = setInterval(
			processCertificateStatus,
			config.get("general.clusterCertificateCheckIntervalMs")
		);

		// Set a timeout to clear the interval
		timeoutId = setTimeout(() => {
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = null;
			}
			timeoutId = null;
		}, config.get("general.clusterCertificateCheckTimeoutMs"));
	} catch (err) {
		console.error(
			`Cannot create cluster level domain certificates. ${
				err.response?.body?.message ?? err.message
			}`
		);
	}
}

/**
 * Checks the status of the certificate and updates the ingress controller and platform ingresses if the certificate is issued.
 * @returns {Promise<void>} A Promise that resolves when the certificate status is checked and the ingress controller is updated.
 */
async function processCertificateStatus() {
	// Get the cluster object to get the domain
	const cluster = await clsCtrl.getOneByQuery(
		{
			clusterAccesssToken: process.env.CLUSTER_ACCESS_TOKEN,
		},
		{
			cacheKey: process.env.CLUSTER_ACCESS_TOKEN,
		}
	);
	const domain = cluster.domains[0];
	const secretName = config.get("general.clusterDomainSecret");
	// Get the status of the certificate
	const certificateStatus = await getCertificateStatus(secretName);
	// If the certificate is issued, update the ingress controller to use the new certificate
	if (certificateStatus === "Issued") {
		// Clear the interval for certificate status check
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}

		// Clear the timeout for certificate status check
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}

		// Update the ingress controller to use the new certificate as the default
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

				// Get all container ingresses that will be impacted
				// The impacted ones will be the ingresses of "platform" and "sync" container.
				// Subdomain based ingresses will not be impacted since we cannot add a subdomain based ingress if we do not have a cluster domain
				let containers = await cntrCtrl.getManyByQuery(
					{
						"networking.ingress.enabled": true,
						"networking.ingress.type": "path",
					},
					{ lookup: "environmentId" }
				);

				// Add the domain to the container ingresses
				await addClusterDomainToIngresses(containers, domain);
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
	}

	// Update cluster certificate status
	let updatedCluster = await clsCtrl.updateOneById(
		cluster._id,
		{ certificateStatus: certificateStatus },
		{},
		{
			cacheKey: process.env.CLUSTER_ACCESS_TOKEN,
		}
	);

	// Send realtime message about the certificate status of the cluster
	sendMessage("cluster", {
		actor: null,
		action: "telemetry",
		object: "cluster",
		description: `Cluster domain certificate status updated to '${certificateStatus}'`,
		timestamp: Date.now(),
		data: updatedCluster,
		identifiers: null,
	});
}

/**
 * Retrieves the status of a certificate.
 *
 * @param {string} certificateName - The name of the certificate.
 * @returns {string} The status of the certificate. Possible values are "Issued", "Not Ready", "Issuing", or "Error".
 */
async function getCertificateStatus(certificateName) {
	try {
		const res = await k8sCustomObjectApi.getNamespacedCustomObject(
			"cert-manager.io", // Group
			"v1", // Version
			process.env.NAMESPACE, // Namespace
			"certificates", // Plural of the resource
			certificateName // Name of the resource
		);

		const certificate = res.body;

		// Check the status of the certificate
		if (certificate.status && certificate.status.conditions) {
			const conditions = certificate.status.conditions;
			const readyCondition = conditions.find(
				(condition) => condition.type === "Ready"
			);

			if (readyCondition) {
				if (readyCondition.status === "True") {
					return "Issued";
				} else {
					return "Not Ready";
				}
			} else {
				return "Issuing";
			}
		} else {
			return "Error";
		}
	} catch (err) {
		console.error(
			`Error fetching cluster domain certificate. ${
				err.response?.body?.message ?? err.message
			}`
		);
		return "Error";
	}
}

/**
 * Deletes the cluster domain certificate.
 * @returns {Promise<void>} A promise that resolves when the certificates are deleted.
 */
export async function deleteClusterDomainCertificate() {
	// Clear the interval for certificate status check
	if (intervalId) {
		clearInterval(intervalId);
		intervalId = null;
	}

	// Clear the timeout for certificate status check
	if (timeoutId) {
		clearTimeout(timeoutId);
		timeoutId = null;
	}

	const secretName = config.get("general.clusterDomainSecret");
	await deleteCertificate(secretName, process.env.NAMESPACE);

	// Update the nginx-controller to remove certificate as the default
	const ingressDeployment = await getNginxIngressControllerDeployment();
	if (ingressDeployment) {
		try {
			// Remove existing entry if any
			ingressDeployment.spec.template.spec.containers[0].args =
				ingressDeployment.spec.template.spec.containers[0].args.filter(
					(entry) => !entry.startsWith("--default-ssl-certificate=")
				);

			await k8sAppsApi.replaceNamespacedDeployment(
				ingressDeployment.metadata.name,
				process.env.NGINX_NAMESPACE,
				ingressDeployment
			);

			console.info(
				`Updated ingress controller to remove the cluster domain '${domain}' and '*.${domain}' certificate as the default certificate.`
			);
		} catch (err) {
			console.error(
				`Cannot update ingress-nginx-controller to remove the cluster certificate as the default tls certificate. ${
					err.response?.body?.message ?? err.message
				}`
			);
		}
	} else {
		console.error(
			`Cannot retrive the ingress-nginx-controller deployment to patch for default certificate.`
		);
	}
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
