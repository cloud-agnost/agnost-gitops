import fs from "fs";
import k8s from "@kubernetes/client-node";
import path from "path";
import yaml from "js-yaml";
import { fileURLToPath } from "url";
import { getK8SResource } from "./util.js";

// Kubernetes client configuration
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sBatchApi = kc.makeApiClient(k8s.BatchV1Api);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Definition is container
export async function createCronJob(definition, namespace) {
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
	console.log(
		`CronJob '${definition.iid}' in namespace '${namespace}' created successfully`
	);
}

// Definition is container
export async function updateCronJob(definition, namespace) {
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
	console.log(
		`CronJob '${definition.iid}' in namespace '${namespace}' updated successfully`
	);
}

export async function deleteCronJob(name, namespace) {
	if (!(await getK8SResource("CronJob", name, namespace))) return;

	try {
		await k8sBatchApi.deleteNamespacedCronJob(name, namespace);
		console.log(
			`CronJob '${name}' in namespace ${namespace} deleted successfully`
		);
	} catch (err) {
		console.error(
			`Error deleting CronJob '${name}' in namespace ${namespace}. ${err.response?.body?.message}`
		);
	}
}
