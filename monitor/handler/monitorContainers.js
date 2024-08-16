import config from "config";
import helper from "../util/helper.js";
import axios from "axios";
import k8s from "@kubernetes/client-node";

import { getDBClient } from "../init/db.js";

// Create a Kubernetes core API client
const kubeconfig = new k8s.KubeConfig();
kubeconfig.loadFromDefault();
const k8sApi = kubeconfig.makeApiClient(k8s.AppsV1Api);
const k8sCoreApi = kubeconfig.makeApiClient(k8s.CoreV1Api);
const k8sBatchApi = kubeconfig.makeApiClient(k8s.BatchV1Api);

/**
 * Monitors the status of containers in the cluster and logs the status to the platform.
 * @returns {Promise<void>} A promise that resolves when the monitoring is complete.
 */
export async function monitorContainers() {
	try {
		let pageNumber = 0;
		let pageSize = config.get("general.containerPaginationSize");
		let containers = await getContainers(pageNumber, pageSize);

		while (containers && containers.length) {
			for (let i = 0; i < containers.length; i++) {
				const container = containers[i];

				const environment = container.environment[0];
				if (!environment) continue;

				let result = null;
				let needsUpdate = container.status ? false : true;
				if (container.type === "deployment") {
					result = await getDeploymentStatus(container.iid, environment.iid);
					if (result && container.status) {
						if (
							result.status !== container.status.status ||
							result.availableReplicas !== container.status.availableReplicas ||
							result.readyReplicas !== container.status.readyReplicas ||
							result.replicas !== container.status.replicas ||
							result.updatedReplicas !== container.status.updatedReplicas
						)
							needsUpdate = true;
					}
				} else if (container.type === "statefulset") {
					result = await getStatefulSetStatus(container.iid, environment.iid);
					if (result && container.status) {
						if (
							result.status !== container.status.status ||
							result.availableReplicas !== container.status.availableReplicas ||
							result.readyReplicas !== container.status.readyReplicas ||
							result.replicas !== container.status.replicas ||
							result.updatedReplicas !== container.status.updatedReplicas ||
							result.currentReplicas !== container.status.currentReplicas
						)
							needsUpdate = true;
					}
				} else if (container.type === "cronjob") {
					result = await getCronJobStatus(container.iid, environment.iid);
					if (result && container.status) {
						if (
							result.status !== container.status.status ||
							(result.lastScheduleTime &&
								container.status.lastScheduleTime &&
								result.lastScheduleTime.getTime() !==
									new Date(container.status.lastScheduleTime).getTime()) ||
							(result.lastSuccessfulTime &&
								container.status.lastSuccessfulTime &&
								result.lastSuccessfulTime.getTime() !==
									new Date(container.status.lastSuccessfulTime).getTime())
						)
							needsUpdate = true;
					}
				}

				if (result && needsUpdate) {
					console.info(
						`Updating the status of container ${container.iid} in namespace ${
							environment.iid
						}. ${JSON.stringify(result)}`
					);

					// Make api call to the platform to log the status of the container
					axios
						.post(
							helper.getPlatformUrl() + "/v1/telemetry/container/status",
							{ container, status: result },
							{
								headers: {
									Authorization: process.env.MASTER_TOKEN,
									"Content-Type": "application/json",
								},
							}
						)
						.catch((err) => {
							console.error(
								`Cannot send container telemetry data to platform. ${
									err.response?.body?.message ?? err.message
								}`
							);
						});
				}
			}

			// Interate to the next page
			pageNumber++;
			containers = await getContainers(pageNumber, pageSize);
		}
	} catch (err) {
		console.error(`Cannot fetch cluster containers. ${err}`);
	}
}

/**
 * Returns the list of containers from the cluster database
 * @param  {number} pageNumber Curent page number (used for pagination)
 * @param  {number} pageSize The records per page
 */
async function getContainers(pageNumber, pageSize) {
	let dbClient = getDBClient();

	let pipeline = [
		{
			$match: {},
		},
		{
			$lookup: {
				from: "environments",
				localField: "environmentId",
				foreignField: "_id",
				as: "environment",
			},
		},
		{ $skip: pageSize * pageNumber },
		{ $limit: pageSize },
	];

	return await dbClient
		.db("agnost")
		.collection("containers")
		.aggregate(pipeline)
		.toArray();
}

/**
 * Retrieves the status of a deployment in a given namespace.
 *
 * @param {string} name - The name of the deployment.
 * @param {string} namespace - The namespace of the deployment.
 * @returns {Object|null} - The deployment status object, or null if an error occurred.
 */
async function getDeploymentStatus(name, namespace) {
	try {
		// Get the deployment details
		const deploymentResponse = await k8sApi.readNamespacedDeployment(
			name,
			namespace
		);
		const deployment = deploymentResponse.body;
		const deploymentStatus = deployment.status;

		// Get all pods for the deployment
		const podResponse = await k8sCoreApi.listNamespacedPod(
			namespace,
			undefined,
			undefined,
			undefined,
			undefined,
			`app=${name}`
		);
		const pods = podResponse.body.items;

		// Calculate deployment state
		const desiredReplicas = deployment.spec.replicas || 0;
		const readyReplicas = deployment.status.readyReplicas || 0;
		const updatedReplicas = deployment.status.updatedReplicas || 0;

		const podStatuses = pods.map((pod) => pod.status.phase);
		const errorPods = podStatuses.filter(
			(status) => status === "Failed" || status === "Unknown"
		).length;
		const totalPods = podStatuses.length;

		let status = "Unknown";
		if (desiredReplicas > readyReplicas && readyReplicas === 0) {
			if (totalPods === 0) status = "Error";
			else status = "Creating";
		} else if (desiredReplicas !== updatedReplicas) {
			status = "Updating";
		} else if (errorPods > 0 && errorPods < totalPods) {
			status = "Warning";
		} else if (errorPods === totalPods) {
			status = "Error";
		} else {
			status = "Running";
		}

		return {
			...deploymentStatus,
			status,
			creationTimestamp: deployment.metadata.creationTimestamp,
		};
	} catch (err) {
		console.error(
			`Cannot get Deployment ${name} status in namespace ${namespace}. ${
				err.response?.body?.message ?? err.message
			}`
		);
		return null;
	}
}

/**
 * Retrieves the status of a StatefulSet and its associated pods.
 * @param {string} name - The name of the StatefulSet.
 * @param {string} namespace - The namespace of the StatefulSet.
 * @returns {Object|null} - The status of the StatefulSet and its creation timestamp, or null if an error occurs.
 */
async function getStatefulSetStatus(name, namespace) {
	try {
		// Get the StatefulSet details
		const statefulSetResponse = await k8sApi.readNamespacedStatefulSet(
			name,
			namespace
		);
		const statefulSet = statefulSetResponse.body;
		const statefulSetStatus = statefulSet.status;

		// Get all pods for the StatefulSet
		const podResponse = await k8sCoreApi.listNamespacedPod(
			namespace,
			undefined,
			undefined,
			undefined,
			undefined,
			`app=${name}`
		);
		const pods = podResponse.body.items;

		// Calculate StatefulSet state
		const desiredReplicas = statefulSet.spec.replicas || 0;
		const readyReplicas = statefulSet.status.readyReplicas || 0;
		const updatedReplicas = statefulSet.status.updatedReplicas || 0;

		const podStatuses = pods.map((pod) => pod.status.phase);
		const errorPods = podStatuses.filter(
			(status) => status === "Failed" || status === "Unknown"
		).length;
		const totalPods = podStatuses.length;

		let status = "Unknown";
		if (desiredReplicas > readyReplicas && readyReplicas === 0) {
			if (totalPods === 0) status = "Error";
			else status = "Creating";
		} else if (desiredReplicas !== updatedReplicas) {
			status = "Updating";
		} else if (errorPods > 0 && errorPods < totalPods) {
			status = "Warning";
		} else if (errorPods === totalPods) {
			status = "Error";
		} else {
			status = "Running";
		}

		return {
			...statefulSetStatus,
			status,
			creationTimestamp: statefulSet.metadata.creationTimestamp,
		};
	} catch (err) {
		console.error(
			`Cannot get StatefulSet ${name} status in namespace ${namespace}. ${
				err.response?.body?.message ?? err.message
			}`
		);
		return null;
	}
}

/**
 * Retrieves the status of a CronJob.
 *
 * @param {string} name - The name of the CronJob.
 * @param {string} namespace - The namespace of the CronJob.
 * @returns {Object|null} - The status of the CronJob, or null if an error occurred.
 */
async function getCronJobStatus(name, namespace) {
	try {
		// Get the CronJob details
		const cronJobResponse = await k8sBatchApi.readNamespacedCronJob(
			name,
			namespace
		);
		const cronJob = cronJobResponse.body;

		// Get all Jobs created by the CronJob
		const jobResponse = await k8sBatchApi.listNamespacedJob(namespace);
		const jobs = jobResponse.body.items.filter((job) =>
			job.metadata.name.includes(name)
		);

		// Calculate CronJob state
		const activeJobs = jobs.filter((job) => job.status.active).length;
		const succeededJobs = jobs.filter((job) => job.status.succeeded).length;
		const failedJobs = jobs.filter((job) => job.status.failed).length;
		const lastJob = jobs.sort(
			(a, b) => new Date(b.status.startTime) - new Date(a.status.startTime)
		)[0];

		let status = "Unknown";
		if (!lastJob) {
			status = "Scheduled";
		} else if (activeJobs > 0) {
			status = "Running";
		} else if (lastJob && lastJob.status.succeeded) {
			status = "Successful";
		} else if (lastJob && lastJob.status.failed) {
			status = "Failed";
		} else if (failedJobs > 0 && succeededJobs > 0) {
			status = "Warning";
		} else {
			status = "Unknown";
		}

		return {
			...cronJob.status,
			status,
			creationTimestamp: cronJob.metadata.creationTimestamp,
		};
	} catch (err) {
		console.error(
			`Cannot get CronJob ${name} status in namespace ${namespace}. ${
				err.response?.body?.message ?? err.message
			}`
		);
		return null;
	}
}
