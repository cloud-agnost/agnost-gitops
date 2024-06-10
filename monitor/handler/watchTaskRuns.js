import axios from "axios";
import k8s from "@kubernetes/client-node";
import helper from "../util/helper.js";

// Create a Kubernetes core API client
const kubeconfig = new k8s.KubeConfig();
kubeconfig.loadFromDefault();
const k8sCustomApi = kubeconfig.makeApiClient(k8s.CustomObjectsApi);

var watchRequest = null; // To store the watch request

/**
 * Watches build events and updates the build status of containers.
 */
export async function watchBuildEvents() {
	if (watchRequest) return;

	const watch = new k8s.Watch(kubeconfig);
	const namespace = "tekton-builds";

	/**
	 * Start watching build events.
	 */
	async function startWatching() {
		try {
			console.info("Started watching build events...");
			let now = new Date().getTime();
			watchRequest = watch.watch(
				`/api/v1/namespaces/${namespace}/events`,
				{
					fieldSelector: "involvedObject.kind=TaskRun", // Filter events for a specific resource type
				},
				(type, event) => {
					let eventTime = null;
					if (event.lastTimestamp)
						eventTime = new Date(event.lastTimestamp).getTime();
					else if (event.firstTimestamp)
						eventTime = new Date(event.firstTimestamp).getTime();

					if (eventTime && eventTime < now) return;

					if (
						event.reason === "Failed" ||
						event.reason === "Succeeded" ||
						event.reason === "Error" ||
						event.reason === "Started" ||
						event.reason === "Running" ||
						event.reason === "TaskRunCancelled" ||
						event.reason === "TaskRunTimeout" ||
						event.reason === "TaskRunImagePullFailed"
					) {
						// Get task run name from the involved object
						let taskRunName = event.involvedObject.name;
						// Get the taskrun object
						getTaskRun(taskRunName).then((taskRunObj) => {
							const eventListenerName =
								taskRunObj.metadata.labels["triggers.tekton.dev/eventlistener"];
							if (!eventListenerName) return;

							// Extract containeriid from the event listener name
							const regex = /[a-zA-Z]+-[a-zA-Z0-9]+$/;
							const match = eventListenerName.match(regex);
							let containeriid = match ? match[0] : null;

							if (containeriid) {
								console.info(
									`Updating the build status of container ${containeriid}. ${event.reason?.replace(
										"TaskRun",
										""
									)}`
								);
								//Make api call to the platform to update the build status of the container
								axios
									.post(
										helper.getPlatformUrl() + "/v1/telemetry/pipeline/status",
										{
											containeriid,
											status: event.reason?.replace("TaskRun", ""),
										},
										{
											headers: {
												Authorization: process.env.MASTER_TOKEN,
												"Content-Type": "application/json",
											},
										}
									)
									.catch((err) => {
										console.error(
											`Cannot send build pipeline run status data of container ${containeriid} to platform. ${
												err.response?.body?.message ?? err.message
											}`
										);
									});
							}
						});
					}
				},
				(err) => {
					console.error(
						`Error while watching for build events. ${
							err?.response?.body?.message ?? err?.message
						}`
					);
					// Retry the watch after a delay
					setTimeout(startWatching, 2000);
				}
			);
		} catch (err) {
			console.error(
				`Error while watching for build events. ${
					err.response?.body?.message ?? err.message
				}`
			);
			// Retry the watch after a delay if still watching
			setTimeout(startWatching, 1000);
		}
	}

	startWatching();
}

/**
 * Stops watching build events.
 */
export function stopWatchingBuildEvents() {
	try {
		if (watchRequest) {
			watchRequest.abort();
			watchRequest = null;
			console.info("Stopped watching build events.");
		}
	} catch (err) {
		console.error(
			`Error while stopping the watch for build events. ${
				err.response?.body?.message ?? err.message
			}`
		);
		watchRequest = null;
	}
}

/**
 * Retrieves information about a TaskRun
 * @param {string} taskRunName - The name of the TaskRun.
 * @returns {Promise<Object|null>} - A Promise that resolves to the TaskRun object if found, or null if not found.
 */
async function getTaskRun(taskRunName) {
	try {
		const response = await k8sCustomApi.getNamespacedCustomObject(
			"tekton.dev", // The API group for Tekton
			"v1beta1", // The API version for Tekton
			"tekton-builds", // The namespace of the TaskRun
			"taskruns", // The plural name of the resource
			taskRunName // The name of the TaskRun
		);

		return response.body;
	} catch (err) {
		console.error(
			`Cannot get TaskRun ${taskRunName} in namespace tekton-builds. ${
				err.response?.body?.message ?? err.message
			}`
		);
		return null;
	}
}
