import k8s from "@kubernetes/client-node";
import { getK8SResource } from "./util.js";

// Kubernetes client configuration
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);

/**
 * Checks if TCP proxy is already enabled for the specified public port.
 * @param {number} publicPort - The public port to check.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the TCP proxy is already enabled.
 */
export async function isTCPProxyAlreadyEnabled(publicPort) {
	if (!publicPort) return false;

	const resourceNamespace = process.env.NGINX_NAMESPACE;
	const deployments = await k8sAppsApi.listNamespacedDeployment(
		resourceNamespace
	);

	for (const deployment of deployments.body.items) {
		if (deployment.metadata.name.includes("ingress-nginx-controller")) {
			const deployName = deployment.metadata.name;
			const dply = await k8sAppsApi.readNamespacedDeployment(
				deployName,
				resourceNamespace
			);

			// To eliminate duplicates remove already exiting public port if any
			const exists = dply.body.spec.template.spec.containers[0].ports.find(
				(entry) => entry.containerPort.toString() === publicPort.toString()
			);

			if (exists) return true;
		}
	}

	return false;
}

/**
 * Enables the TCP proxy for the service, mainly exposes the service to outside world through ingress at a specific port number
 *
 * @param {string} serviceName - The name of the service to enable TCP proxy.
 * @param {string} namespace - The namespace of the service.
 * @param {number} portNumber - The port number to open.
 * @param {number} resourcePort - The resource object port number (internal resource port number).
 * @returns {Promise<void>} - A promise that resolves when the TCP proxy is enabled.
 */
export async function createTCPProxy(
	serviceName,
	namespace,
	portNumber,
	resourcePort
) {
	/*  We need to patch below on ingress-nginx namespace:
                1. ConfigMap/tcp-services
                2. Service/ingress-nginx-controller
                3. Deployment/ingress-nginx-controller */

	const configMapName = "tcp-services";
	const resourceNamespace = process.env.NGINX_NAMESPACE;

	// get the backend service information
	let backendSvc = await getK8SResource("Service", serviceName, namespace);
	let protocol =
		backendSvc.body.spec.ports.find((entry) => entry.port === resourcePort)
			.protocol ?? "TCP";

	try {
		// patch configmap/tcp-service
		const cfgmap = await k8sCoreApi.readNamespacedConfigMap(
			configMapName,
			resourceNamespace
		);

		cfgmap.body.data = {
			...cfgmap.body.data,
			[portNumber]: `${namespace}/${serviceName}:${resourcePort}`,
		};

		await k8sCoreApi.replaceNamespacedConfigMap(
			configMapName,
			resourceNamespace,
			cfgmap.body
		);
	} catch (error) {
		if (error.body.code === 404 && error.body.details.name == "tcp-services") {
			const configMap = {
				apiVersion: "v1",
				kind: "ConfigMap",
				metadata: { name: configMapName },
				data: { [portNumber]: `${namespace}/${serviceName}:${resourcePort}` },
			};
			try {
				await k8sCoreApi.createNamespacedConfigMap(
					resourceNamespace,
					configMap
				);
			} catch (err) {
				console.error(
					`Cannot create configmap/tcp-service while creating a TCP proxy port. ${
						err.response?.body?.message ?? err.message
					}`
				);
			}
		} else {
			throw error;
		}
	}

	// patch service/ingress-nginx-controller
	const portName = "proxied-tcp-" + portNumber;
	k8sCoreApi.listNamespacedService(resourceNamespace).then((res) => {
		res.body.items.forEach(async (service) => {
			if (service.metadata.name.includes("ingress-nginx-controller")) {
				try {
					const svcName = service.metadata.name;
					const svc = await k8sCoreApi.readNamespacedService(
						svcName,
						resourceNamespace
					);
					const newPort = {
						name: portName,
						port: portNumber,
						targetPort: portNumber,
						protocol: protocol,
					};
					// To eliminate duplicates remove already exiting public port if any
					svc.body.spec.ports = svc.body.spec.ports.filter(
						(svcPort) => svcPort.port.toString() !== portNumber.toString()
					);
					svc.body.spec.ports.push(newPort);
					await k8sCoreApi.replaceNamespacedService(
						svcName,
						resourceNamespace,
						svc.body
					);
				} catch (err) {
					console.error(
						`Cannot update ingress-nginx-controller service while creating a new TCP proxy port. ${
							err.response?.body?.message ?? err.message
						}`
					);
				}
			}
		});
	});

	// patch deployment/ingress-nginx-controller
	k8sAppsApi.listNamespacedDeployment(resourceNamespace).then((res) => {
		res.body.items.forEach(async (deployment) => {
			if (deployment.metadata.name.includes("ingress-nginx-controller")) {
				try {
					const deployName = deployment.metadata.name;
					const dply = await k8sAppsApi.readNamespacedDeployment(
						deployName,
						resourceNamespace
					);

					// Add the required arguments to the ingress-nginx-controller deployment
					const tcpServciesConfigMap =
						dply.body.spec.template.spec.containers[0].args.find((entry) =>
							entry.startsWith("--tcp-services-configmap=")
						);

					if (!tcpServciesConfigMap) {
						dply.body.spec.template.spec.containers[0].args.push(
							"--tcp-services-configmap=$(POD_NAMESPACE)/tcp-services"
						);
					}

					const newContainerPort = {
						containerPort: portNumber,
						hostPort: portNumber,
						protocol: protocol,
					};

					// To eliminate duplicates remove already exiting public port if any
					dply.body.spec.template.spec.containers[0].ports =
						dply.body.spec.template.spec.containers[0].ports.filter(
							(entry) =>
								entry.containerPort.toString() !== portNumber.toString()
						);
					dply.body.spec.template.spec.containers[0].ports.push(
						newContainerPort
					);
					await k8sAppsApi.replaceNamespacedDeployment(
						deployName,
						resourceNamespace,
						dply.body
					);
				} catch (err) {
					console.error(
						`Cannot update ingress-nginx-controller deployment while creating a new TCP proxy port. ${
							err.response?.body?.message ?? err.message
						}`
					);
				}
			}
		});
	});

	console.info(`TCP proxy port '${portNumber}' exposed successfully`);
}

/**
 * Updates the TCP proxy based on the provided definition.
 * @param {Object} definition - The definition object containing the TCP proxy configuration which is a container json object.
 * @param {string} name - The name of the TCP proxy service.
 * @param {string} namespace - The namespace of the TCP proxy service.
 * @returns {Promise<void>} - A promise that resolves when the TCP proxy is updated.
 */
export async function updateTCPProxy(definition, name, namespace) {
	const enabled = await isTCPProxyAlreadyEnabled(
		definition.tcpProxy.publicPort
	);
	if (definition.tcpProxy.enabled) {
		if (!enabled) {
			await createTCPProxy(
				name,
				namespace,
				definition.tcpProxy.publicPort,
				definition.containerPort
			);
		} else {
			await deleteTCPProxy(definition.tcpProxy.publicPort);
			await createTCPProxy(
				name,
				namespace,
				definition.tcpProxy.publicPort,
				definition.containerPort
			);
		}
	} else {
		if (enabled) await deleteTCPProxy(definition.tcpProxy.publicPort);
	}
}

/**
 * Deletes a TCP proxy for the specified port number.
 * @param {number} portNumber - The port number of the TCP proxy to delete.
 * @returns {Promise<void>} - A promise that resolves when the TCP proxy is deleted.
 */
export async function deleteTCPProxy(portNumber) {
	if (!portNumber) return;
	await deleteTCPProxyPorts([portNumber]);
}

/**
 * Deletes TCP proxy ports from the configuration.
 * @param {number[]} portNumbers - An array of port numbers to be deleted.
 * @returns {Promise<void>} - A promise that resolves when the ports are successfully deleted.
 */
export async function deleteTCPProxyPorts(portNumbers) {
	if (!portNumbers || portNumbers.length === 0) return;
	const configMapName = "tcp-services";
	const resourceNamespace = process.env.NGINX_NAMESPACE;
	portNumbers = portNumbers.map((portNumber) => portNumber.toString());

	try {
		// patch configmap/tcp-service
		const cfgmap = await k8sCoreApi.readNamespacedConfigMap(
			configMapName,
			resourceNamespace
		);
		portNumbers.forEach((portNumber) => {
			delete cfgmap.body.data[portNumber];
		});
		await k8sCoreApi.replaceNamespacedConfigMap(
			configMapName,
			resourceNamespace,
			cfgmap.body
		);
	} catch (err) {
		console.error(
			`Cannot update configmap/tcp-services while deleting TCP proxy ports. ${
				err.response?.body?.message ?? err.message
			}`
		);
	}

	// patch service/ingress-nginx-controller
	k8sCoreApi.listNamespacedService(resourceNamespace).then((res) => {
		res.body.items.forEach(async (service) => {
			if (service.metadata.name.includes("ingress-nginx-controller")) {
				try {
					const svcName = service.metadata.name;
					const svc = await k8sCoreApi.readNamespacedService(
						svcName,
						resourceNamespace
					);
					svc.body.spec.ports = svc.body.spec.ports.filter(
						(svcPort) => !portNumbers.includes(svcPort.port.toString())
					);
					await k8sCoreApi.replaceNamespacedService(
						svcName,
						resourceNamespace,
						svc.body
					);
				} catch (err) {
					console.error(
						`Cannot update ingress-nginx-controller service while deleting TCP proxy ports. ${
							err.response?.body?.message ?? err.message
						}`
					);
				}
			}
		});
	});

	// patch deployment/ingress-nginx-controller
	k8sAppsApi.listNamespacedDeployment(resourceNamespace).then((res) => {
		res.body.items.forEach(async (deployment) => {
			if (deployment.metadata.name.includes("ingress-nginx-controller")) {
				try {
					const deployName = deployment.metadata.name;
					const dply = await k8sAppsApi.readNamespacedDeployment(
						deployName,
						resourceNamespace
					);
					dply.body.spec.template.spec.containers[0].ports =
						dply.body.spec.template.spec.containers[0].ports.filter(
							(contPort) =>
								!portNumbers.includes(contPort.containerPort.toString())
						);
					await k8sAppsApi.replaceNamespacedDeployment(
						deployName,
						resourceNamespace,
						dply.body
					);
				} catch (err) {
					console.error(
						`Cannot update ingress-nginx-controller deployment while deleting TCP proxy ports. ${
							err.response?.body?.message ?? err.message
						}`
					);
				}
			}
		});
	});

	console.info(
		`TCP proxy ports '${portNumbers.join(", ")}' unexposed successfully`
	);
}
