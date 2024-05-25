import axios from "axios";
import k8s from "@kubernetes/client-node";

// Create a Kubernetes core API client
const kubeconfig = new k8s.KubeConfig();
kubeconfig.loadFromDefault();
const k8sCustomApi = kubeconfig.makeApiClient(k8s.CustomObjectsApi);

var watchRequest = null; // To store the watch request

export async function watchBuildEvents() {
	if (watchRequest) return;

	const watch = new k8s.Watch(kubeconfig);
	const namespace = "tekton-builds";

	async function startWatching() {
		try {
			logger.info("Started watching build events...");
			let now = new Date().getTime();
			watchRequest = watch.watch(
				`/api/v1/namespaces/${namespace}/events`,
				{
					fieldSelector: "involvedObject.kind=TaskRun", // Filter events for a specific resource type
				},
				(type, event, watchObj) => {
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
						getTaskRun(taskRunName)
							.then((taskRunObj) => {
								const eventListenerName =
									taskRunObj.metadata.labels[
										"triggers.tekton.dev/eventlistener"
									];
								if (!eventListenerName) return;

								const regex = /[a-zA-Z]+-[a-zA-Z0-9]+$/;
								const match = eventListenerName.match(regex);
								let containeriid = match ? match[0] : null;

								if (containeriid) {
									//Make api call to the platform to update the build status of the container
									axios
										.post(
											helper.getPlatformUrl() + "/v1/telemetry/pipeline-status",
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
										.catch((error) => {});
								}
							})
							.catch((error) => {});
					}
				},
				(err) => {
					console.error("Watch error:", err);
					// Retry the watch after a delay
					setTimeout(startWatching, 1000);
				}
			);
		} catch (err) {
			console.error("Exception caught:", err);
			// Retry the watch after a delay if still watching
			setTimeout(startWatching, 1000);
		}
	}

	startWatching();
}

export function stopWatchingBuildEvents() {
	try {
		if (watchRequest) {
			watchRequest.abort();
			watchRequest = null;
			console.log("Stopped watching build events stopped.");
		}
	} catch (err) {
		watchRequest = null;
	}
}

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
		return null;
	}
}
