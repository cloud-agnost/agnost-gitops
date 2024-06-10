import fs from "fs";
import k8s from "@kubernetes/client-node";
import path from "path";
import yaml from "js-yaml";
import { fileURLToPath } from "url";
import { getK8SResource, getProbeConfig, getImage } from "./util.js";

// Kubernetes client configuration
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates a StatefulSet in a Kubernetes namespace.
 * @param {Object} definition - The definition of the StatefulSet, basically the container object.
 * @param {string} namespace - The namespace in which to create the StatefulSet.
 * @param {string} registry - The container registry to pull the image from.
 * @returns {Promise<void>} - A promise that resolves when the StatefulSet is created successfully.
 */
export async function createStatefulSet(definition, namespace, registry) {
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
	container.image = getImage(container.image, definition, registry);
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

/**
 * Updates a StatefulSet in Kubernetes.
 * @param {Object} definition - The definition of the StatefulSet, basically the container object.
 * @param {string} namespace - The namespace of the StatefulSet.
 * @param {string} registry - The registry for the container image.
 * @returns {Promise<void>} - A Promise that resolves when the StatefulSet is updated successfully.
 */
export async function updateStatefulSet(definition, namespace, registry) {
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
	container.image = getImage(container.image, definition, registry);
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
	// If it is not from a template, delete the startup probe
	else if (!definition.template?.name) delete container.startupProbe;

	if (readiness.enabled) container.readinessProbe = getProbeConfig(readiness);
	// If it is not from a template, delete the readiness probe
	else if (!definition.template?.name) delete container.readinessProbe;

	if (liveness.enabled) container.livenessProbe = getProbeConfig(liveness);
	// If it is not from a template, delete the liveness probe
	else if (!definition.template?.name) delete container.livenessProbe;

	// Configure container volume mounts, we cannot update persistent volume claims once they are created in a stateful set
	const { storageConfig } = definition;
	// If storage enabled and it is not from a template then make the changes
	// Storage for templates are handled in the template handler, so we don't need to handle it here
	if (!definition.template?.name) {
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

/**
 * Deletes a StatefulSet from a Kubernetes cluster.
 *
 * @param {string} name - The name of the StatefulSet to delete.
 * @param {string} namespace - The namespace of the StatefulSet.
 * @returns {Promise<void>} - A Promise that resolves when the StatefulSet is deleted successfully.
 */
export async function deleteStatefulSet(name, namespace) {
	if (!(await getK8SResource("StatefulSet", name, namespace))) return;

	try {
		await k8sAppsApi.deleteNamespacedStatefulSet(name, namespace);
		console.info(
			`StatefulSet '${name}' in namespace ${namespace} deleted successfully`
		);
	} catch (err) {
		console.error(
			`Error deleting StatefulSet '${name}' in namespace ${namespace}. ${
				err.response?.body?.message ?? err.message
			}`
		);
	}
}
