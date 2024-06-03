import fs from "fs";
import k8s from "@kubernetes/client-node";
import path from "path";
import yaml from "js-yaml";
import { fileURLToPath } from "url";
import { getK8SResource, getProbeConfig } from "./util.js";

// Kubernetes client configuration
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Definition is container
export async function createDeployment(definition, namespace) {
	const manifest = fs.readFileSync(
		`${__dirname}/manifests/deployment.yaml`,
		"utf8"
	);
	const resource = yaml.load(manifest);
	const { metadata, spec } = resource;

	// Configure name, namespace and labels
	metadata.name = definition.iid;
	metadata.namespace = namespace;
	spec.replicas = definition.deploymentConfig.desiredReplicas;
	spec.selector.matchLabels.app = definition.iid;
	spec.template.metadata.labels.app = definition.iid;

	// Configure restart policy
	spec.template.spec.restartPolicy = definition.podConfig.restartPolicy;
	// Configure container
	const container = spec.template.spec.containers[0];
	container.name = definition.iid;
	container.ports[0].containerPort = definition.networking.containerPort;
	container.resources.requests.cpu =
		definition.podConfig.cpuRequestType === "millicores"
			? `${definition.podConfig.cpuRequest}m`
			: definition.podConfig.cpuRequest;
	container.resources.requests.memory =
		definition.podConfig.memoryRequestType === "mebibyte"
			? `${definition.podConfig.memoryRequest}Mi`
			: `${definition.podConfig.memoryRequest}Gi`;
	container.resources.limits.cpu =
		definition.podConfig.cpuLimitType === "millicores"
			? `${definition.podConfig.cpuLimit}m`
			: definition.podConfig.cpuLimit;
	container.resources.limits.memory =
		definition.podConfig.memoryLimitType === "mebibyte"
			? `${definition.podConfig.memoryLimit}Mi`
			: `${definition.podConfig.memoryLimit}Gi`;

	// Define environment variables
	container.env = [
		{ name: "AGNOST_ENVIRONMENT_IID", value: namespace },
		{ name: "AGNOST_CONTAINER_IID", value: definition.iid },
		...definition.variables,
	];

	// Configure container probes
	const { startup, readiness, liveness } = definition.probes;
	if (startup.enabled) container.startupProbe = getProbeConfig(startup);
	else delete container.startupProbe;

	if (readiness.enabled) container.readinessProbe = getProbeConfig(readiness);
	else delete container.readinessProbe;

	if (liveness.enabled) container.livenessProbe = getProbeConfig(liveness);
	else delete container.livenessProbe;

	// Configure container volume mounts
	const { storageConfig } = definition;
	if (storageConfig.enabled) {
		container.volumeMounts = [
			{
				name: "storage",
				mountPath: storageConfig.mountPath,
			},
		];

		spec.template.spec.volumes = [
			{
				name: "storage",
				persistentVolumeClaim: {
					claimName: definition.iid,
				},
			},
		];
	} else {
		delete container.volumeMounts;
		delete spec.template.spec.volumes;
	}

	await k8sAppsApi.createNamespacedDeployment(namespace, resource);
	console.info(
		`Deployment '${definition.iid}' in namespace '${namespace}' created successfully`
	);
}

// Definition is container
export async function updateDeployment(definition, namespace) {
	const payload = await getK8SResource("Deployment", definition.iid, namespace);
	const { metadata, spec } = payload.body;

	// Configure name, namespace and labels
	metadata.name = definition.iid;
	metadata.namespace = namespace;
	spec.replicas = definition.deploymentConfig.desiredReplicas;
	spec.selector.matchLabels.app = definition.iid;
	spec.template.metadata.labels.app = definition.iid;

	// Configure restart policy
	spec.template.spec.restartPolicy = definition.podConfig.restartPolicy;
	// Configure container
	const container = spec.template.spec.containers[0];
	container.name = definition.iid;
	container.ports[0].containerPort = definition.networking.containerPort;
	container.resources.requests.cpu =
		definition.podConfig.cpuRequestType === "millicores"
			? `${definition.podConfig.cpuRequest}m`
			: definition.podConfig.cpuRequest;
	container.resources.requests.memory =
		definition.podConfig.memoryRequestType === "mebibyte"
			? `${definition.podConfig.memoryRequest}Mi`
			: `${definition.podConfig.memoryRequest}Gi`;
	container.resources.limits.cpu =
		definition.podConfig.cpuLimitType === "millicores"
			? `${definition.podConfig.cpuLimit}m`
			: definition.podConfig.cpuLimit;
	container.resources.limits.memory =
		definition.podConfig.memoryLimitType === "mebibyte"
			? `${definition.podConfig.memoryLimit}Mi`
			: `${definition.podConfig.memoryLimit}Gi`;

	// Define environment variables
	container.env = [
		{ name: "AGNOST_ENVIRONMENT_IID", value: namespace },
		{ name: "AGNOST_CONTAINER_IID", value: definition.iid },
		...definition.variables,
	];

	// Configure container probes
	const { startup, readiness, liveness } = definition.probes;
	if (startup.enabled) container.startupProbe = getProbeConfig(startup);
	else delete container.startupProbe;

	if (readiness.enabled) container.readinessProbe = getProbeConfig(readiness);
	else delete container.readinessProbe;

	if (liveness.enabled) container.livenessProbe = getProbeConfig(liveness);
	else delete container.livenessProbe;

	// Configure container volume mounts
	const { storageConfig } = definition;
	if (storageConfig.enabled) {
		container.volumeMounts = [
			{
				name: "storage",
				mountPath: storageConfig.mountPath,
			},
		];

		spec.template.spec.volumes = [
			{
				name: "storage",
				persistentVolumeClaim: {
					claimName: definition.iid,
				},
			},
		];
	} else {
		delete container.volumeMounts;
		delete spec.template.spec.volumes;
	}

	await k8sAppsApi.replaceNamespacedDeployment(
		definition.iid,
		namespace,
		payload.body
	);
	console.info(
		`Deployment '${definition.iid}' in namespace '${namespace}' updated successfully`
	);
}

export async function deleteDeployment(name, namespace) {
	if (!(await getK8SResource("Deployment", name, namespace))) return;

	try {
		await k8sAppsApi.deleteNamespacedDeployment(name, namespace);
		console.info(
			`Deployment '${name}' in namespace ${namespace} deleted successfully`
		);
	} catch (err) {
		console.error(
			`Error deleting deployment '${name}' in namespace ${namespace}. ${err.response?.body?.message}`
		);
	}
}
