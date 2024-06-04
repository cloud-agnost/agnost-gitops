import fs from "fs";
import k8s from "@kubernetes/client-node";
import path from "path";
import yaml from "js-yaml";
import { fileURLToPath } from "url";
import { getK8SResource } from "./util.js";

// Kubernetes client configuration
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sAutoscalingApi = kc.makeApiClient(k8s.AutoscalingV2Api);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Definition is deploymentConfig
export async function createHPA(definition, name, namespace) {
	if (!definition.cpuMetric.enabled && !definition.cpuMetric.memoryMetric)
		return;

	const manifest = fs.readFileSync(`${__dirname}/manifests/hpa.yaml`, "utf8");
	const resource = yaml.load(manifest);
	const { metadata, spec } = resource;

	// Configure name, namespace and labels
	metadata.name = name;
	metadata.namespace = namespace;

	// Set target deployment and replicas
	spec.scaleTargetRef.name = name;
	spec.minReplicas = definition.minReplicas;
	spec.maxReplicas = definition.maxReplicas;

	// Clear the metrics part
	spec.metrics = [];
	if (definition.cpuMetric.enabled) {
		// Configure CPU metric
		spec.metrics.push({
			type: "Resource",
			resource: {
				name: "cpu",
				target: {
					type:
						definition.cpuMetric.metricType === "AverageUtilization"
							? "Utilization"
							: "AverageValue",
					[definition.cpuMetric.metricType === "AverageUtilization"
						? "averageUtilization"
						: "averageValue"]:
						definition.cpuMetric.metricType === "AverageUtilization" ||
						definition.cpuMetric.metricType === "AverageValueCores"
							? definition.cpuMetric.metricValue
							: `${definition.cpuMetric.metricValue}m`,
				},
			},
		});
	}

	if (definition.memoryMetric.enabled) {
		// Configure CPU metric
		spec.metrics.push({
			type: "Resource",
			resource: {
				name: "memory",
				target: {
					type: "AverageValue",
					averageValue:
						definition.memoryMetric.metricType === "AverageValueMebibyte"
							? `${definition.memoryMetric.metricValue}Mi`
							: `${definition.memoryMetric.metricValue}Gi`,
				},
			},
		});
	}

	// Create the HPA
	await k8sAutoscalingApi.createNamespacedHorizontalPodAutoscaler(
		namespace,
		resource
	);
	console.info(
		`HPA '${name}' in namespace '${namespace}' created successfully`
	);
}

// Definition is deploymentConfig
export async function updateHPA(definition, name, namespace) {
	if (!definition.cpuMetric.enabled && !definition.cpuMetric.memoryMetric) {
		await deleteHPA(name, namespace);
		return;
	}

	const payload = await getK8SResource("HPA", name, namespace);
	if (!payload) {
		await createHPA(definition, name, namespace);
		return;
	}
	const { metadata, spec } = payload.body;
	// Configure name, namespace and labels
	metadata.name = name;
	metadata.namespace = namespace;

	// Set target deployment and replicas
	spec.scaleTargetRef.name = name;
	spec.minReplicas = definition.minReplicas;
	spec.maxReplicas = definition.maxReplicas;

	// Clear the metrics part
	spec.metrics = [];
	if (definition.cpuMetric.enabled) {
		// Configure CPU metric
		spec.metrics.push({
			type: "Resource",
			resource: {
				name: "cpu",
				target: {
					type:
						definition.cpuMetric.metricType === "AverageUtilization"
							? "Utilization"
							: "AverageValue",
					[definition.cpuMetric.metricType === "AverageUtilization"
						? "averageUtilization"
						: "averageValue"]:
						definition.cpuMetric.metricType === "AverageUtilization" ||
						definition.cpuMetric.metricType === "AverageValueCores"
							? definition.cpuMetric.metricValue
							: `${definition.cpuMetric.metricValue}m`,
				},
			},
		});
	}

	if (definition.memoryMetric.enabled) {
		// Configure CPU metric
		spec.metrics.push({
			type: "Resource",
			resource: {
				name: "memory",
				target: {
					type: "AverageValue",
					averageValue:
						definition.memoryMetric.metricType === "AverageValueMebibyte"
							? `${definition.memoryMetric.metricValue}Mi`
							: `${definition.memoryMetric.metricValue}Gi`,
				},
			},
		});
	}

	// Create the HPA
	await k8sAutoscalingApi.replaceNamespacedHorizontalPodAutoscaler(
		name,
		namespace,
		payload.body
	);
	console.info(
		`HPA '${name}' in namespace '${namespace}' updated successfully`
	);
}

export async function deleteHPA(name, namespace) {
	if (!(await getK8SResource("HPA", name, namespace))) return;

	try {
		await k8sAutoscalingApi.deleteNamespacedHorizontalPodAutoscaler(
			name,
			namespace
		);
		console.info(
			`HPA '${name}' in namespace ${namespace} deleted successfully`
		);
	} catch (err) {
		console.error(
			`Error deleting HPA '${name}' in namespace ${namespace}. ${
				err.response?.body?.message ?? err.message
			}`
		);
	}
}
