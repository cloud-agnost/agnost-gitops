import fs from "fs";
import k8s from "@kubernetes/client-node";
import path from "path";
import { fileURLToPath } from "url";
import clsCtrl from "../controllers/cluster.js";

// Kubernetes client configuration
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sAutoscalingApi = kc.makeApiClient(k8s.AutoscalingV2Api);
const k8sNetworkingApi = kc.makeApiClient(k8s.NetworkingV1Api);
const k8sBatchApi = kc.makeApiClient(k8s.BatchV1Api);
const k8sAuthApi = kc.makeApiClient(k8s.RbacAuthorizationV1Api);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Retrieves the cluster record from the database.
 * @returns {Promise<Object>} The cluster record.
 */
export async function getClusterRecord() {
	// Get cluster configuration
	return await clsCtrl.getOneByQuery(
		{
			clusterAccesssToken: process.env.CLUSTER_ACCESS_TOKEN,
		},
		{
			cacheKey: process.env.CLUSTER_ACCESS_TOKEN,
		}
	);
}

/**
 * Returns the probe configuration based on the provided config object.
 * @param {Object} config - The configuration object.
 * @param {number} config.initialDelaySeconds - The initial delay in seconds before starting the probe.
 * @param {number} config.periodSeconds - The period in seconds between probe checks.
 * @param {number} config.timeoutSeconds - The timeout in seconds for each probe check.
 * @param {number} config.failureThreshold - The number of consecutive failures required to mark the probe as failed.
 * @param {string} config.checkMechanism - The mechanism used for probe checks. Possible values: "exec", "httpGet", "tcpSocket".
 * @param {string} [config.execCommand] - The command to execute for the "exec" check mechanism.
 * @param {string} [config.httpPath] - The path to use for the "httpGet" check mechanism.
 * @param {number} [config.httpPort] - The port to use for the "httpGet" check mechanism.
 * @param {number} [config.tcpPort] - The port to use for the "tcpSocket" check mechanism.
 * @returns {Object} - The probe configuration object.
 */
export function getProbeConfig(config) {
	const probe = {
		initialDelaySeconds: config.initialDelaySeconds,
		periodSeconds: config.periodSeconds,
		timeoutSeconds: config.timeoutSeconds,
		failureThreshold: config.failureThreshold,
	};

	if (config.checkMechanism === "exec") {
		return {
			exec: { command: config.execCommand.split("\n") },
			...probe,
		};
	} else if (config.checkMechanism === "httpGet") {
		return {
			httpGet: { path: config.httpPath, port: config.httpPort },
			...probe,
		};
	} else {
		return {
			tcpSocket: { port: config.tcpPort },
			...probe,
		};
	}
}

/**
 * Retrieves a Kubernetes resource based on the provided kind, name, and namespace.
 * @param {string} kind - The kind of the Kubernetes resource.
 * @param {string} name - The name of the Kubernetes resource.
 * @param {string} namespace - The namespace of the Kubernetes resource.
 * @returns {Promise<object|null>} - A promise that resolves to the retrieved Kubernetes resource, or null if not found.
 */
export async function getK8SResource(kind, name, namespace) {
	try {
		switch (kind) {
			case "Namespace":
				return await k8sCoreApi.readNamespace(name);
			case "Deployment":
				return await k8sAppsApi.readNamespacedDeployment(name, namespace);
			case "StatefulSet":
				return await k8sAppsApi.readNamespacedStatefulSet(name, namespace);
			case "CronJob":
				return await k8sBatchApi.readNamespacedCronJob(name, namespace);
			case "Job":
				return await k8sBatchApi.readNamespacedJob(name, namespace);
			case "HPA":
				return await k8sAutoscalingApi.readNamespacedHorizontalPodAutoscaler(
					name,
					namespace
				);
			case "Service":
				return await k8sCoreApi.readNamespacedService(name, namespace);
			case "Ingress":
				return await k8sNetworkingApi.readNamespacedIngress(name, namespace);
			case "ServiceAccount":
				return await k8sCoreApi.readNamespacedServiceAccount(name, namespace);
			case "Secret":
				return await k8sCoreApi.readNamespacedSecret(name, namespace);
			case "ConfigMap":
				return await k8sCoreApi.readNamespacedConfigMap(name, namespace);
			case "PVC":
				return await k8sCoreApi.readNamespacedPersistentVolumeClaim(
					name,
					namespace
				);
			default:
				console.info(`Skipping: ${kind}`);
				return null;
		}
	} catch {
		return null;
	}
}

/**
 * Retrieves the Nginx Ingress Controller deployment from the specified namespace.
 * @returns {Object|null} The Nginx Ingress Controller deployment object if found, otherwise null.
 */
export async function getNginxIngressControllerDeployment() {
	const result = await k8sAppsApi.listNamespacedDeployment(
		process.env.NGINX_NAMESPACE
	);
	const items = result.body.items;

	for (const deployment of items) {
		if (deployment.metadata.name.includes("ingress-nginx-controller"))
			return deployment;
	}

	return null;
}

/**
 * Retrieves the image URL based on the provided parameters.
 * If the registry is not specified, the original image is returned.
 * If the registry is of type "Public", the image URL from the container's registry is returned.
 * If the registry is not of type "Public", the image URL is constructed using the container's registry information.
 * @param {string} originalImage - The original image.
 * @param {object} container - The container object.
 * @param {object} registry - The registry object.
 * @returns {string} - The image URL.
 */
export function getImage(originalImage, container, registry) {
	if (!registry) return originalImage;

	if (registry.type === "Public") {
		return container.registry.imageUrl;
	}
	// TO-DO this part needs to be updated to support private registries
	else return `${container.registry.imageName}/${container.registry.imageTag}`;
}

/**
 * Creates templated Kubernetes resources based on the provided container and environment.
 * @param {Object} container - The container object.
 * @param {Object} environment - The environment object.
 * @returns {Promise<void>} - A promise that resolves when all resources are created successfully.
 */
export async function createTemplatedK8SResources(container, environment) {
	let manifest = fs.readFileSync(
		`${__dirname}/templates/manifests/${container.template.manifest}`,
		"utf8"
	);

	// We need to replace the values in raw manifest with the values from the container and environment
	const object = { ...container, namespace: environment.iid };
	const regex = /{{\s*[^\r\n\t\f\v{}]*\s*}}/g;
	const matches = manifest.match(regex);
	const results = [...new Set(matches)];
	for (const result of results) {
		const key = result.replace("{{", "").replace("}}", "").trim();
		const value = getObjectValue(object, key);
		// Create a regular expression to find all occurrences of the key wrapped in {{ }}
		const replacementRegex = new RegExp(result, "g");
		// Replace all occurrences with the corresponding value
		manifest = manifest.replace(replacementRegex, value);
	}

	const resources = k8s.loadAllYaml(manifest);
	for (const resource of resources) {
		try {
			const { kind, metadata } = resource;
			switch (kind) {
				case "ServiceAccount":
					await k8sCoreApi.createNamespacedServiceAccount(
						environment.iid,
						resource
					);
					break;
				case "Secret":
					await k8sCoreApi.createNamespacedSecret(environment.iid, resource);
					break;
				case "ConfigMap":
					await k8sCoreApi.createNamespacedConfigMap(environment.iid, resource);
					break;
				case "ClusterRoleBinding":
					await k8sAuthApi.createClusterRoleBinding(resource);
					break;
				case "RoleBinding":
					await k8sAuthApi.createNamespacedRoleBinding(
						environment.iid,
						resource
					);
					break;
				case "Ingress":
					await k8sNetworkingApi.createNamespacedIngress(
						environment.iid,
						resource
					);
					break;
				case "PersistentVolumeClaim":
					await k8sCoreApi.createNamespacedPersistentVolumeClaim(
						environment.iid,
						resource
					);
					break;
				case "HorizontalPodAutoscaler":
					await k8sAutoscalingApi.createNamespacedHorizontalPodAutoscaler(
						environment.iid,
						resource
					);
					break;
				case "Service":
					await k8sCoreApi.createNamespacedService(environment.iid, resource);
					break;
				case "CronJob":
					await k8sBatchApi.createNamespacedCronJob(environment.iid, resource);
					break;
				case "Deployment":
					await k8sAppsApi.createNamespacedDeployment(
						environment.iid,
						resource
					);
					break;
				case "StatefulSet":
					await k8sAppsApi.createNamespacedStatefulSet(
						environment.iid,
						resource
					);
					break;
				case "Pod":
					await k8sCoreApi.createNamespacedPod(environment.iid, resource);
					break;
				case "Job":
					await k8sBatchApi.createNamespacedJob(environment.iid, resource);
					break;
				default:
					console.info(
						`Skipping: ${kind} creation in namespace ${environment.iid}`
					);
					continue;
			}
			console.info(
				`${kind} '${metadata.name}' in namespace '${environment.iid}' using template manifest '${container.template.manifest}' created successfully`
			);
		} catch (err) {
			console.error(
				`Error applying ${container.template.manifest} manifest resource ${
					resource.kind
				} ${resource.metadata.name}. ${
					err.response?.body?.message ?? err.message
				}`
			);
			throw err;
		}
	}
}

/**
 * Deletes templated Kubernetes resources based on the provided container and environment.
 * @param {object} container - The container object.
 * @param {object} environment - The environment object.
 * @returns {Promise<void>} - A promise that resolves when all resources are deleted successfully.
 */
export async function deleteTemplatedK8SResources(container, environment) {
	let manifest = fs.readFileSync(
		`${__dirname}/templates/manifests/${container.template.manifest}`,
		"utf8"
	);

	// We need to replace the values in raw manifest with the values from the container and environment
	const object = { ...container, namespace: environment.iid };
	const regex = /{{\s*[^\r\n\t\f\v{}]*\s*}}/g;
	const matches = manifest.match(regex);
	const results = [...new Set(matches)];
	for (const result of results) {
		const key = result.replace("{{", "").replace("}}", "").trim();
		const value = getObjectValue(object, key);
		// Create a regular expression to find all occurrences of the key wrapped in {{ }}
		const replacementRegex = new RegExp(result, "g");
		// Replace all occurrences with the corresponding value
		manifest = manifest.replace(replacementRegex, value);
	}

	const resources = k8s.loadAllYaml(manifest);
	for (const resource of resources) {
		try {
			const { kind, metadata } = resource;
			switch (kind) {
				case "ServiceAccount":
					await k8sCoreApi.deleteNamespacedServiceAccount(
						metadata.name,
						environment.iid
					);
					break;
				case "Secret":
					await k8sCoreApi.deleteNamespacedSecret(
						metadata.name,
						environment.iid
					);
					break;
				case "ConfigMap":
					await k8sCoreApi.deleteNamespacedConfigMap(
						metadata.name,
						environment.iid
					);
					break;
				case "ClusterRoleBinding":
					await k8sAuthApi.createClusterRoleBinding(metadata.name);
					break;
				case "RoleBinding":
					await k8sAuthApi.deleteNamespacedRoleBinding(
						metadata.name,
						environment.iid
					);
					break;
				case "Ingress":
					await k8sNetworkingApi.deleteNamespacedIngress(
						metadata.name,
						environment.iid
					);
					break;
				case "PersistentVolumeClaim":
					await k8sCoreApi.deleteNamespacedPersistentVolumeClaim(
						metadata.name,
						environment.iid
					);
					break;
				case "HorizontalPodAutoscaler":
					await k8sAutoscalingApi.deleteNamespacedHorizontalPodAutoscaler(
						metadata.name,
						environment.iid
					);
					break;
				case "Service":
					await k8sCoreApi.deleteNamespacedService(
						metadata.name,
						environment.iid
					);
					break;
				case "CronJob":
					await k8sBatchApi.deleteNamespacedCronJob(
						metadata.name,
						environment.iid
					);
					break;
				case "Deployment":
					await k8sAppsApi.deleteNamespacedDeployment(
						metadata.name,
						environment.iid
					);
					break;
				case "StatefulSet":
					await k8sAppsApi.deleteNamespacedStatefulSet(
						metadata.name,
						environment.iid
					);
					break;
				case "Pod":
					await k8sCoreApi.deleteNamespacedPod(metadata.name, environment.iid);
					break;
				case "Job":
					await k8sBatchApi.deleteNamespacedJob(metadata.name, environment.iid);
					break;
				default:
					console.info(
						`Skipping: ${kind} creation in namespace ${environment.iid}`
					);
					continue;
			}
			console.info(
				`${kind} '${metadata.name}' in namespace '${environment.iid}' from template manifest '${container.template.manifest}' deleted successfully`
			);
		} catch (err) {
			console.error(
				`Error deleting ${container.template.manifest} manifest resource ${
					resource.kind
				} ${resource.metadata.name}. ${
					err.response?.body?.message ?? err.message
				}`
			);
		}
	}
}

/**
 * Checks if there are changes in the repository.
 *
 * @param {Array} changes - The array of changes.
 * @returns {boolean} - Returns true if there are changes in the repository, otherwise false.
 */
export function hasRepoChanges(changes) {
	return areThereChanges(changes, ["repo"]);
}

/**
 * Checks if there are any deployment changes based on the specified changes and properties.
 *
 * @param {Object} changes - The changes object containing the modified properties.
 * @returns {boolean} - Returns true if there are deployment changes, false otherwise.
 */
export function hasDeploymentChanges(changes) {
	return areThereChanges(changes, [
		"registry",
		"networking.containerPort",
		"deploymentConfig",
		"podConfig",
		"variables",
		"probes",
		"storageConfig.enabled",
		"storageConfig.mountPath",
	]);
}

/**
 * Checks if there are changes related to Persistent Volume Claims (PVC).
 *
 * @param {Object} changes - The changes object.
 * @returns {boolean} - True if there are changes related to PVC, false otherwise.
 */
export function hasPVCChanges(changes) {
	return areThereChanges(changes, [
		"storageConfig.enabled",
		"storageConfig.sizeType",
		"storageConfig.size",
		"storageConfig.accessModes",
	]);
}

/**
 * Checks if there are changes related to a service.
 * @param {Object[]} changes - The array of changes.
 * @returns {boolean} - Returns true if there are changes related to the service, otherwise false.
 */
export function hasServiceChanges(changes) {
	return areThereChanges(changes, ["networking.containerPort"]);
}

/**
 * Checks if there are any changes related to Horizontal Pod Autoscaler (HPA) configuration.
 *
 * @param {Object} changes - The changes object containing the modified properties.
 * @returns {boolean} - Returns true if there are changes related to HPA configuration, otherwise false.
 */
export function hasHPAChanges(changes) {
	return areThereChanges(changes, [
		"deploymentConfig.minReplicas",
		"deploymentConfig.maxReplicas",
		"deploymentConfig.cpuMetric.enabled",
		"deploymentConfig.cpuMetric.metricType",
		"deploymentConfig.cpuMetric.metricValue",
		"deploymentConfig.memoryMetric.enabled",
		"deploymentConfig.memoryMetric.metricType",
		"deploymentConfig.memoryMetric.metricValue",
	]);
}

/**
 * Checks if there are changes related to ingress.
 *
 * @param {Object} changes - The changes object.
 * @returns {boolean} - True if there are changes related to ingress, false otherwise.
 */
export function hasIngressChanges(changes) {
	return areThereChanges(changes, [
		"networking.containerPort",
		"networking.ingress.enabled",
		"networking.ingress.type",
	]);
}

/**
 * Checks if there are changes related to ingress type.
 *
 * @param {Object} changes - The changes object.
 * @returns {boolean} - True if there are changes related to ingress, false otherwise.
 */
export function hasIngressTypeChanges(changes) {
	return areThereChanges(changes, ["networking.ingress.type"]);
}

/**
 * Checks if there are changes related to custom domain settings.
 *
 * @param {Object} changes - The changes object to check.
 * @returns {boolean} - True if there are changes related to custom domain settings, false otherwise.
 */
export function hasCustomDomainChanges(changes) {
	return areThereChanges(changes, [
		"networking.containerPort",
		"networking.customDomain.enabled",
		"networking.customDomain.domain",
	]);
}

/**
 * Checks if there are changes related to custom domain name specificly.
 *
 * @param {Object} changes - The changes object to check.
 * @returns {boolean} - True if there are changes related to custom domain name, false otherwise.
 */
export function hasCustomDomainNameChanges(changes) {
	return areThereChanges(changes, ["networking.customDomain.domain"]);
}

/**
 * Checks if there are changes related to TCP proxy configuration.
 *
 * @param {Object} changes - The changes object containing the modified properties.
 * @returns {boolean} - Returns true if there are changes related to TCP proxy configuration, false otherwise.
 */
export function hasTCPProxyChanges(changes) {
	return areThereChanges(changes, [
		"networking.containerPort",
		"networking.tcpProxy.enabled",
		"networking.tcpProxy.publicPort",
	]);
}

/**
 * Checks if there are changes in the specified properties of a stateful set.
 * @param {Object} changes - The changes object containing the modified properties.
 * @returns {boolean} - Returns true if there are changes in the specified properties, otherwise returns false.
 */
export function hasStatefulSetChanges(changes) {
	return areThereChanges(changes, [
		"registry",
		"networking.containerPort",
		"statefulSetConfig",
		"podConfig",
		"variables",
		"probes",
		"storageConfig.enabled",
		"storageConfig.mountPath",
	]);
}

/**
 * Checks if there are any changes related to a CronJob.
 * @param {Object} changes - The changes object.
 * @returns {boolean} - True if there are changes related to a CronJob, false otherwise.
 */
export function hasCronJobChanges(changes) {
	return areThereChanges(changes, [
		"registry",
		"cronJobConfig",
		"podConfig",
		"variables",
		"storageConfig.enabled",
		"storageConfig.mountPath",
	]);
}

/**
 * Checks if there are any changes that start with the specified prefixes.
 *
 * @param {string[]} changes - The array of changes to check.
 * @param {string[]} prefixes - The array of prefixes to match against the changes.
 * @returns {boolean} - Returns true if there are changes that start with any of the prefixes, false otherwise.
 */
function areThereChanges(changes, prefixes) {
	for (const prefix of prefixes) {
		for (const change of changes) {
			if (change.startsWith(prefix)) return true;
		}
	}

	return false;
}

/**
 * Retrieves the value of a nested property from an object.
 *
 * @param {object} object - The object to retrieve the value from.
 * @param {string} key - The key representing the nested property.
 * @returns {any} - The value of the nested property, or null if it doesn't exist.
 */
function getObjectValue(object, key) {
	const path = key.split(".");
	let current = object;
	for (let i = 0; i < path.length - 1; i++) {
		const field = path[i];
		if (!current[field]) {
			return null;
		}
		current = current[field];
	}

	let value = current[path[path.length - 1]];
	if (value === "gibibyte") return "Gi";
	else if (value === "mebibyte") return "Mi";
	else if (value === "millicores") return "m";
	else if (value === "cores") return "";
	else return value;
}

/**
 * Deletes a container pod in the specified namespace.
 *
 * @param {string} namespace - The namespace of the pod.
 * @param {string} podName - The name of the pod to delete.
 * @returns {Promise<void>} - A promise that resolves when the pod is deleted successfully.
 */
export async function deleteContainerPod(namespace, podName) {
	try {
		await k8sCoreApi.deleteNamespacedPod(podName, namespace);
		console.info(
			`Pod '${podName}' in namespace '${namespace}' deleted successfully`
		);
	} catch (err) {
		console.error(
			`Error deleting pod ${podName}. ${
				err.response?.body?.message ?? err.message
			}`
		);
	}
}
