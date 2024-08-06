import config from "config";
import k8s from "@kubernetes/client-node";
import c from "config";

// Kubernetes client configuration
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sCustomObjectApi = kc.makeApiClient(k8s.CustomObjectsApi);

/**
 * Retrieves the pods associated with a container in a specific environment.
 * @param {Object} options - The options for retrieving the pods.
 * @param {Object} options.container - The container object.
 * @param {string} options.container.type - The type of the container.
 * @param {string} options.container.iid - The identifier of the container.
 * @param {Object} options.environment - The environment object.
 * @param {string} options.environment.iid - The identifier of the environment.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of pod objects.
 * @throws {Error} - If there is an error retrieving the pods.
 */
export async function getContainerPods({ container, environment }) {
	try {
		const { body } = await k8sCoreApi.listNamespacedPod(environment.iid);
		const pods = body.items
			.filter((pod) => {
				if (container.type === "cronjob")
					return pod.metadata.labels["job-name"]?.includes(container.iid);
				else return pod.metadata.labels.app === container.iid;
			})
			.map((entry) => {
				const totalContainers = entry.spec.containers.length;
				const readyContainers = entry.status.containerStatuses
					? entry.status.containerStatuses.filter((cs) => cs.ready).length
					: 0;
				const restarts = entry.status.containerStatuses
					? entry.status.containerStatuses.reduce(
							(acc, cs) => acc + cs.restartCount,
							0
					  )
					: 0;

				const containerStates = entry.status.containerStatuses
					? entry.status.containerStatuses.map((cs) => {
							if (cs.state.running)
								return {
									state: "Running",
									startedAt: cs.state.running.startedAt,
								};
							else if (cs.state.waiting)
								return {
									state: "Waiting",
									reason: cs.state.waiting.reason,
									message: cs.state.waiting.message,
								};
							else if (cs.state.terminated)
								return {
									state: "Terminated",
									reason: cs.state.terminated.reason,
									message: cs.state.terminated.message,
								};
							else return { state: "Unknown" };
					  })
					: [];

				let status = "Unknown";
				if (entry.status.phase === "Pending") status = "Pending";
				else if (entry.status.phase === "Succeeded") status = "Succeeded";
				else if (entry.status.phase === "Failed") {
					status = "Failed";
				} else if (entry.status.phase === "Running") {
					if (containerStates.every((entry) => entry.state === "Running"))
						status = "Running";
					else if (containerStates.some((entry) => entry.state === "Waiting"))
						status = containerStates.find(
							(entry) => entry.state === "Waiting"
						).reason;
					else if (
						containerStates.some((entry) => entry.state === "Terminated")
					)
						status = containerStates.find(
							(entry) => entry.state === "Terminated"
						).reason;
				}

				return {
					name: entry.metadata.name,
					status: status,
					states: containerStates,
					totalContainers: totalContainers,
					readyContainers: readyContainers,
					restarts: restarts,
					createdOn: entry.metadata.creationTimestamp,
					conditions: entry.status.conditions.sort(
						(a, b) => a.lastTransitionTime - b.lastTransitionTime
					),
				};
			})
			.sort((a, b) => {
				// Handle cases where lastTimestamp might not be present
				const dateA = a.createdOn ? new Date(a.createdOn) : 0;
				const dateB = b.createdOn ? new Date(b.createdOn) : 0;
				return dateB - dateA; // Descending order
			});

		return pods;
	} catch (err) {
		throw new Error(
			`Cannot get pods of the ${container.type} named '${container.name}''. ${
				err.response?.body?.message ?? err.message
			}`
		);
	}
}

/**
 * Retrieves container events based on the provided container and environment.
 *
 * @param {Object} options - The options for retrieving container events.
 * @param {Object} options.container - The container object.
 * @param {string} options.container.iid - The ID of the container.
 * @param {string} options.container.name - The name of the container.
 * @param {string} options.container.type - The type of the container.
 * @param {Object} options.environment - The environment object.
 * @param {string} options.environment.iid - The ID of the environment.
 * @returns {Array} - An array of container events.
 * @throws {Error} - If there is an error retrieving the events.
 */
export async function getContainerEvents({ container, environment }) {
	try {
		const { body } = await k8sCoreApi.listNamespacedEvent(environment.iid);
		const events = body.items
			.filter((event) => event.involvedObject.name.includes(container.iid))
			.map((entry) => {
				return {
					name: entry.involvedObject.name,
					message: entry.message,
					reason: entry.reason,
					firstSeen: entry.firstTimestamp,
					lastSeen: entry.lastTimestamp,
					count: entry.count,
					kind: entry.involvedObject.kind,
					type: entry.type,
				};
			})
			.sort((a, b) => {
				// Handle cases where lastSeen might not be present
				const dateA = a.lastSeen ? new Date(a.lastSeen) : 0;
				const dateB = b.lastSeen ? new Date(b.lastSeen) : 0;
				return dateB - dateA; // Descending order
			});
		return events;
	} catch (err) {
		throw new Error(
			`Cannot get events of the ${container.type} named '${container.name}''. ${
				err.response?.body?.message ?? err.message
			}`
		);
	}
}

/**
 * Retrieves the container logs for a given container and environment.
 * @param {Object} options - The options for retrieving container logs.
 * @param {Object} options.container - The container object.
 * @param {Object} options.environment - The environment object.
 * @returns {Promise<Object>} - A promise that resolves to an object containing the pods and their logs.
 * @throws {Error} - If there is an error retrieving the logs.
 */
export async function getContainerLogs({ container, environment }) {
	try {
		const payload = await getContainerPods({
			container,
			environment,
		});

		// For each pod we need to get the logs
		const logPromises = payload.map((pod) => {
			const podName = pod.name;
			return k8sCoreApi
				.readNamespacedPodLog(
					podName,
					environment.iid,
					container.template ? undefined : container.iid,
					undefined,
					undefined,
					undefined,
					false,
					undefined,
					undefined,
					config.get("general.logLimitNumberOfLines"),
					false
				)
				.then((logs) => ({
					podName: podName,
					logs: logs.body ? logs.body.split("\n") : [],
				}))
				.catch((error) => ({
					podName: podName,
					error: "Failed to fetch logs",
					details: error.message,
					logs: [],
				}));
		});

		const logsResults = await Promise.all(logPromises);

		return { pods: payload, logs: logsResults };
	} catch (err) {
		throw new Error(
			`Cannot get logs of the ${container.type} named '${container.name}''. ${
				err.response?.body?.message ?? err.message
			}`
		);
	}
}

/**
 * Retrieves the container task runs based on the provided container information.
 * @param {Object} container - The container object containing the container information.
 * @param {string} container.iid - The identifier of the container.
 * @param {string} container.type - The type of the container.
 * @param {string} container.name - The name of the container.
 * @returns {Array} An array of task runs associated with the container.
 * @throws {Error} If there is an error retrieving the task runs.
 */
export async function getContainerTaskRuns({ container }) {
	try {
		const { body } = await k8sCustomObjectApi.listNamespacedCustomObject(
			"tekton.dev",
			"v1beta1",
			"tekton-builds",
			"taskruns",
			undefined,
			undefined,
			undefined,
			undefined,
			`triggers.tekton.dev/eventlistener=${container.repo.type}-listener-${container.slug}`,
			config.get("general.taskRunPageSize")
		);

		const taskruns = body.items
			.map((taskrun) => {
				const { status } = taskrun;
				let runStatus = "Unknown";
				if (status && status.conditions) {
					const condition = status.conditions.find(
						(cond) => cond.type === "Succeeded"
					);
					if (condition) {
						if (condition.status === "True") {
							runStatus = "Succeeded";
						} else if (condition.status === "False") {
							if (condition.reason === "TaskRunCancelled")
								runStatus = "Cancelled";
							else runStatus = "Failed";
						} else {
							runStatus = "Running";
						}
					} else {
						runStatus = "Pending";
					}
				}

				const setupStep = taskrun.spec.taskSpec.steps.find(
					(step) => step.name === "setup"
				);
				const variables = {};
				if (setupStep) {
					setupStep.env.forEach((env) => {
						variables[env.name] = env.value ?? null;
					});
				}

				return {
					name: taskrun.metadata.name,
					status: runStatus,
					completionTime: taskrun.status.completionTime,
					startTime: taskrun.status.startTime,
					durationSeconds:
						taskrun.status.completionTime && taskrun.status.startTime
							? Math.floor(
									(new Date(taskrun.status.completionTime) -
										new Date(taskrun.status.startTime)) /
										1000
							  )
							: undefined,
					...variables,
					GIT_COMMIT_ID: variables.GIT_REVISION
						? variables.GIT_REVISION.slice(0, 7)
						: "",
				};
			})
			.sort((a, b) => {
				// Handle cases where lastSeen might not be present
				const dateA = a.startTime ? new Date(a.startTime) : 0;
				const dateB = b.startTime ? new Date(b.startTime) : 0;
				return dateB - dateA; // Descending order
			});
		return taskruns;
	} catch (err) {
		throw new Error(
			`Cannot get build & deploy task runs of the ${container.type} named '${
				container.name
			}''. ${err.response?.body?.message ?? err.message}`
		);
	}
}

/**
 * Retrieves the logs of a task run.
 * @param {Object} options - The options for retrieving the logs.
 * @param {Object} options.container - The container information.
 * @param {string} options.container.type - The type of the container.
 * @param {string} options.container.name - The name of the container.
 * @param {string} options.taskRunName - The name of the task run.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of step information objects.
 * @throws {Error} - If there is an error retrieving the logs.
 */
export async function getTaskRunLogs({ container, taskRunName }) {
	try {
		// Get the pod information
		let resource = null;
		try {
			resource = await k8sCoreApi.readNamespacedPod(
				`${taskRunName}-pod`,
				"tekton-builds"
			);
		} catch (err) {
			console.error(err);
			// This means the TektonRun object has not created a pod yet
			return [];
		}

		const containerStatuses = resource.body.status.containerStatuses;
		if (!containerStatuses || containerStatuses.length === 0) return [];

		const setup = containerStatuses?.find(
			(entry) => entry.name === "step-setup"
		);
		const build = containerStatuses?.find(
			(entry) => entry.name === "step-build"
		);
		const deploy = containerStatuses?.find(
			(entry) => entry.name === "step-deploy"
		);

		const stepPromises = [
			getStepInfo(`${taskRunName}-pod`, "step-setup", "setup", setup),
			getStepInfo(`${taskRunName}-pod`, "step-build", "build", build),
			getStepInfo(`${taskRunName}-pod`, "step-deploy", "deploy", deploy),
		];

		const steps = await Promise.all(stepPromises);

		// Find the last step either in success or error state, there can be other steps in success or error state we are looking to the last one
		let lastIndex = -1;
		for (let i = 0; i < steps.length; i++) {
			const step = steps[i];
			if (step.status === "success" || step.status === "error") {
				lastIndex = i;
			}
		}

		// Set the status of all steps after lastIndex to pending
		if (lastIndex >= 0) {
			for (let i = lastIndex + 1; i < steps.length; i++) {
				if (steps[lastIndex].status === "success" && i === lastIndex + 1)
					steps[i].status = "running";
				else steps[i].status = "pending";
			}
		}

		// If all of them are all in running status then make only the first one running and the rest pending
		const areAllRunning = steps.every((step) => step.status === "running");
		if (areAllRunning) {
			for (let i = 0; i < steps.length; i++) {
				if (i === 0) steps[i].status = "running";
				else steps[i].status = "pending";
			}
		}

		return steps;
	} catch (err) {
		throw new Error(
			`Cannot get build & deploy logs of task run named '${taskRunName}' for ${
				container.type
			} named '${container.name}''. ${
				err.response?.body?.message ?? err.message
			}`
		);
	}
}

/**
 * Retrieves step information for a given pod, container, and step name.
 *
 * @param {string} podName - The name of the pod.
 * @param {string} containerName - The name of the container.
 * @param {string} stepName - The name of the step.
 * @param {object} containerStatus - The status of the container.
 * @returns {Promise<object>} - A promise that resolves to an object containing the step information.
 */
async function getStepInfo(podName, containerName, stepName, containerStatus) {
	let status = "pending";
	if (containerStatus) {
		if (containerStatus.state.running) status = "running";
		else if (containerStatus.state.terminated) {
			if (containerStatus.state.terminated.exitCode === 0) status = "success";
			else status = "error";
		}
	}

	return k8sCoreApi
		.readNamespacedPodLog(podName, "tekton-builds", containerName)
		.then((logs) => ({
			step: stepName,
			status: status,
			logs: logs.body ? logs.body.split("\n") : ["No log available"],
		}))
		.catch(() => ({
			step: stepName,
			status: status,
			logs: ["No log available"],
		}));
}
