import k8s from "@kubernetes/client-node";
import clsCtrl from "../controllers/cluster.js";

// Kubernetes client configuration
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sCustomObjectApi = kc.makeApiClient(k8s.CustomObjectsApi);
const k8sAutoscalingApi = kc.makeApiClient(k8s.AutoscalingV2Api);
const k8sNetworkingApi = kc.makeApiClient(k8s.NetworkingV1Api);
const k8sBatchApi = kc.makeApiClient(k8s.BatchV1Api);

/**
 * Retrieves the cluster record from the database.
 * @returns {Promise<Object>} The cluster record.
 */
export async function getClusterRecord() {
	// Get cluster configuration
	return await clsCtrl.getOneByQuery({
		clusterAccesssToken: process.env.CLUSTER_ACCESS_TOKEN,
	});
}

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
			case "KnativeService":
				return await k8sCustomObjectApi.getNamespacedCustomObject(
					"serving.knative.dev",
					"v1",
					namespace,
					"services",
					name
				);
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
	} catch (err) {
		console.error(err);
		return null;
	}
}
