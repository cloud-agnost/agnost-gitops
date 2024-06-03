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
export async function createStatefulSet(definition, namespace) {
	const manifest = fs.readFileSync(
		`${__dirname}/manifests/statefulset.yaml`,
		"utf8"
	);
	const resource = yaml.load(manifest);
	const { metadata, spec } = resource;

	// Configure name, namespace and labels
	metadata.name = definition.iid;
	metadata.namespace = namespace;
	spec.replicas = definition.statefulSetConfig.desiredReplicas;
	spec.serviceName = definition.iid;
	spec.podManagementPolicy = definition.statefulSetConfig.podManagementPolicy;
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

		spec.volumeClaimTemplates = [
			{
				metadata: { name: "storage" },
				spec: {
					accessModes: storageConfig.accessModes,
					resources: {
						requests: {
							storage:
								storageConfig.sizeType === "mebibyte"
									? `${storageConfig.size}Mi`
									: `${storageConfig.size}Gi`,
						},
					},
				},
			},
		];
		spec.persistentVolumeClaimRetentionPolicy = {
			whenDeleted:
				definition.statefulSetConfig.persistentVolumeClaimRetentionPolicy
					.whenDeleted,
			whenScaled:
				definition.statefulSetConfig.persistentVolumeClaimRetentionPolicy
					.whenScaled,
		};
	} else {
		delete container.volumeMounts;
		delete spec.volumeClaimTemplates;
		delete spec.persistentVolumeClaimRetentionPolicy;
	}

	await k8sAppsApi.createNamespacedStatefulSet(namespace, resource);
	console.info(
		`StatefulSet '${definition.iid}' in namespace '${namespace}' created successfully`
	);
}

// Definition is container
export async function updateStatefulSet(definition, namespace) {
	const payload = await getK8SResource(
		"StatefulSet",
		definition.iid,
		namespace
	);
	const { metadata, spec } = payload.body;

	// Configure name, namespace and labels
	metadata.name = definition.iid;
	metadata.namespace = namespace;
	spec.replicas = definition.statefulSetConfig.desiredReplicas;
	spec.serviceName = definition.iid;
	spec.podManagementPolicy = definition.statefulSetConfig.podManagementPolicy;
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

	// Configure container volume mounts, we cannot update persistent volume claims once they are created in a stateful set
	const { storageConfig } = definition;
	if (storageConfig.enabled) {
		container.volumeMounts = [
			{
				name: "storage",
				mountPath: storageConfig.mountPath,
			},
		];

		spec.persistentVolumeClaimRetentionPolicy = {
			whenDeleted:
				definition.statefulSetConfig.persistentVolumeClaimRetentionPolicy
					.whenDeleted,
			whenScaled:
				definition.statefulSetConfig.persistentVolumeClaimRetentionPolicy
					.whenScaled,
		};
	} else {
		delete container.volumeMounts;
		delete spec.volumeClaimTemplates;
		delete spec.persistentVolumeClaimRetentionPolicy;
	}

	await k8sAppsApi.replaceNamespacedStatefulSet(
		definition.iid,
		namespace,
		payload.body
	);
	console.info(
		`StatefulSet '${definition.iid}' in namespace '${namespace}' updated successfully`
	);
}

export async function deleteStatefulSet(name, namespace) {
	if (!(await getK8SResource("StatefulSet", name, namespace))) return;

	try {
		await k8sAppsApi.deleteNamespacedStatefulSet(name, namespace);
		console.info(
			`StatefulSet '${name}' in namespace ${namespace} deleted successfully`
		);
	} catch (err) {
		console.error(
			`Error deleting StatefulSet '${name}' in namespace ${namespace}. ${err.response?.body?.message}`
		);
	}
}
