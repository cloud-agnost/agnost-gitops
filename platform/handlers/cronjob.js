import fs from "fs";
import k8s from "@kubernetes/client-node";
import path from "path";
import yaml from "js-yaml";
import { fileURLToPath } from "url";
import { getK8SResource, getImage } from "./util.js";

// Kubernetes client configuration
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sBatchApi = kc.makeApiClient(k8s.BatchV1Api);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates a CronJob based on the provided definition.
 * @param {Object} definition - The definition object containing the configuration for the CronJob.
 * @param {string} namespace - The namespace in which to create the CronJob.
 * @param {string} registry - The registry from which to pull the container image.
 * @returns {Promise<void>} - A Promise that resolves when the CronJob is created successfully.
 */
export async function createCronJob(definition, namespace, registry) {
	const manifest = fs.readFileSync(
		`${__dirname}/manifests/cronjob.yaml`,
		"utf8"
	);
	const resource = yaml.load(manifest);
	const { metadata, spec } = resource;

	// Configure schedule timezone and concurrency policy
	metadata.name = definition.iid;
	metadata.namespace = namespace;
	spec.schedule = definition.cronJobConfig.schedule;
	spec.timeZone = definition.cronJobConfig.timeZone;
	spec.concurrencyPolicy = definition.cronJobConfig.concurrencyPolicy;
	spec.suspend = definition.cronJobConfig.suspend;
	spec.successfulJobsHistoryLimit =
		definition.cronJobConfig.successfulJobsHistoryLimit;
	spec.failedJobsHistoryLimit = definition.cronJobConfig.failedJobsHistoryLimit;
	// Configure restart policy
	spec.jobTemplate.spec.template.spec.restartPolicy =
		definition.podConfig.restartPolicy;
	// Configure container
	const container = spec.jobTemplate.spec.template.spec.containers[0];
	container.name = definition.iid;
	container.image = getImage(container.image, definition, registry);
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

	// Configure container volume mounts
	const { storageConfig } = definition;
	if (storageConfig.enabled) {
		container.volumeMounts = [
			{
				name: "storage",
				mountPath: storageConfig.mountPath,
			},
		];

		spec.jobTemplate.spec.template.spec.volumes = [
			{
				name: "storage",
				persistentVolumeClaim: {
					claimName: definition.iid,
				},
			},
		];
	} else {
		delete container.volumeMounts;
		delete spec.jobTemplate.spec.template.spec.volumes;
	}

	await k8sBatchApi.createNamespacedCronJob(namespace, resource);
	console.info(
		`CronJob '${definition.iid}' in namespace '${namespace}' created successfully`
	);
}

/**
 * Updates a CronJob in Kubernetes with the provided definition.
 * @param {Object} definition - The definition of the CronJob.
 * @param {string} namespace - The namespace of the CronJob.
 * @param {string} registry - The registry for the container image.
 * @returns {Promise<void>} - A Promise that resolves when the CronJob is updated successfully.
 */
export async function updateCronJob(definition, namespace, registry) {
	const payload = await getK8SResource("CronJob", definition.iid, namespace);
	const { metadata, spec } = payload.body;

	// Configure schedule timezone and concurrency policy
	metadata.name = definition.iid;
	metadata.namespace = namespace;
	spec.schedule = definition.cronJobConfig.schedule;
	spec.timeZone = definition.cronJobConfig.timeZone;
	spec.concurrencyPolicy = definition.cronJobConfig.concurrencyPolicy;
	spec.suspend = definition.cronJobConfig.suspend;
	spec.successfulJobsHistoryLimit =
		definition.cronJobConfig.successfulJobsHistoryLimit;
	spec.failedJobsHistoryLimit = definition.cronJobConfig.failedJobsHistoryLimit;

	// Configure restart policy
	spec.jobTemplate.spec.template.spec.restartPolicy =
		definition.podConfig.restartPolicy;
	// Configure container
	const container = spec.jobTemplate.spec.template.spec.containers[0];
	container.name = definition.iid;
	container.image = getImage(container.image, definition, registry);
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

	// Configure container volume mounts
	const { storageConfig } = definition;
	if (storageConfig.enabled) {
		container.volumeMounts = [
			{
				name: "storage",
				mountPath: storageConfig.mountPath,
			},
		];

		spec.jobTemplate.spec.template.spec.volumes = [
			{
				name: "storage",
				persistentVolumeClaim: {
					claimName: definition.iid,
				},
			},
		];
	} else {
		delete container.volumeMounts;
		delete spec.jobTemplate.spec.template.spec.volumes;
	}

	await k8sBatchApi.replaceNamespacedCronJob(
		definition.iid,
		namespace,
		payload.body
	);
	console.info(
		`CronJob '${definition.iid}' in namespace '${namespace}' updated successfully`
	);
}

/**
 * Deletes a CronJob with the specified name and namespace.
 *
 * @param {string} name - The name of the CronJob to delete.
 * @param {string} namespace - The namespace of the CronJob.
 * @returns {Promise<void>} - A Promise that resolves when the CronJob is deleted successfully.
 */
export async function deleteCronJob(name, namespace) {
	if (!(await getK8SResource("CronJob", name, namespace))) return;

	try {
		await k8sBatchApi.deleteNamespacedCronJob(name, namespace);
		console.info(
			`CronJob '${name}' in namespace ${namespace} deleted successfully`
		);
	} catch (err) {
		console.error(
			`Error deleting CronJob '${name}' in namespace ${namespace}. ${
				err.response?.body?.message ?? err.message
			}`
		);
	}
}
