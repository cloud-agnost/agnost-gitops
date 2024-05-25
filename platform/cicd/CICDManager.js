import fs from "fs";
import crypto from "crypto";
import * as minio from "minio";
import bcrypt from "bcrypt";
import k8s from "@kubernetes/client-node";
import path from "path";
import yaml from "js-yaml";
import { Octokit } from "@octokit/core";
import axios from "axios";
import { fileURLToPath } from "url";
import clsCtrl from "../controllers/cluster.js";

// Kubernetes client configuration
var dbClient = null;
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sAuthApi = kc.makeApiClient(k8s.RbacAuthorizationV1Api);
const k8sCustomObjectApi = kc.makeApiClient(k8s.CustomObjectsApi);
const k8sAdmissionApi = kc.makeApiClient(k8s.AdmissionregistrationV1Api);
const k8sAutoscalingApi = kc.makeApiClient(k8s.AutoscalingV2Api);
const k8sNetworkingApi = kc.makeApiClient(k8s.NetworkingV1Api);
const k8sBatchApi = kc.makeApiClient(k8s.BatchV1Api);

const agnostNamespace = process.env.NAMESPACE;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CICDManager {
	constructor() {}

	async enableCICDInfrastructure() {
		try {
			await applyManifest(true);
		} catch (err) {
			await deleteManifest(true);
			throw err;
		}
	}

	async disableCICDInfrastructure() {
		await deleteManifest(true);
	}

	async createNamespace(environment) {
		try {
			const manifest = fs.readFileSync(
				`${__dirname}/manifests/namespace.yaml`,
				"utf8"
			);
			const resource = yaml.load(manifest);
			const { metadata } = resource;

			metadata.name = environment.iid;
			await k8sCoreApi.createNamespace(resource);

			return { status: "success" };
		} catch (err) {
			return {
				status: "error",
				message: t(
					`Cannot create the namespace of environment '${environment.name}'. ${
						err.response?.body?.message ?? err.message
					}`
				),
				stack: err.stack,
			};
		}
	}

	async deleteNamespaces({ environmentiids, tcpProxyPorts }) {
		for (const iid of environmentiids) {
			k8sCoreApi.deleteNamespace(iid).then(
				(response) => {
					console.log(`Namespace '${iid}' deleted successfully`);
				},
				(err) => {
					console.error(
						`Error deleting namespace '${iid}'. ${err.response?.body?.message}`
					);
				}
			);
		}

		this.deleteTCPProxyPorts(tcpProxyPorts).catch((err) => {});
		return { status: "success" };
	}

	// Payload includes container info and environment info
	async getContainerPods({ container, environment }) {
		try {
			const { body } = await k8sCoreApi.listNamespacedPod(environment.iid);
			const pods = body.items
				.filter((pod) => {
					if (container.type === "cron job")
						return pod.metadata.labels["job-name"]?.includes(container.iid);
					else if (container.type === "knative service")
						return (
							pod.metadata.labels["serving.knative.dev/service"] ===
							container.iid
						);
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
			return { status: "success", payload: pods };
		} catch (err) {
			return {
				status: "error",
				message: t(
					`Cannot get pods of the ${container.type} named '${
						container.name
					}''. ${err.response?.body?.message ?? err.message}`
				),
				stack: err.stack,
			};
		}
	}

	// Payload includes container info and environment info
	async getContainerEvents({ container, environment }) {
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
			return { status: "success", payload: events };
		} catch (err) {
			return {
				status: "error",
				message: t(
					`Cannot get events of the ${container.type} named '${
						container.name
					}''. ${err.response?.body?.message ?? err.message}`
				),
				stack: err.stack,
			};
		}
	}

	// Payload includes container info and environment info
	async getContainerLogs({ container, environment }) {
		try {
			const { status, payload } = await this.getContainerPods({
				container,
				environment,
			});
			if (status === "error") return { pods: [], logs: [] };

			// For each pod we need to get the logs
			const logPromises = payload.map((pod) => {
				const podName = pod.name;
				return k8sCoreApi
					.readNamespacedPodLog(podName, environment.iid, container.iid)
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

			return {
				status: "success",
				payload: { pods: payload, logs: logsResults },
			};
		} catch (err) {
			return {
				status: "error",
				message: t(
					`Cannot get logs of the ${container.type} named '${
						container.name
					}''. ${err.response?.body?.message ?? err.message}`
				),
				stack: err.stack,
			};
		}
	}

	// Payload includes container info
	async getContainerTaskRuns({ container }) {
		try {
			const { body } = await k8sCustomObjectApi.listNamespacedCustomObject(
				"tekton.dev",
				"v1beta1",
				"tekton-builds",
				"taskruns"
			);
			const taskruns = body.items
				.filter((taskrun) =>
					taskrun.metadata.labels[
						"triggers.tekton.dev/eventlistener"
					]?.includes(container.iid)
				)
				.map((taskrun) => {
					const { status, metadata } = taskrun;
					let runStatus = "Unknown";
					if (status && status.conditions) {
						const condition = status.conditions.find(
							(cond) => cond.type === "Succeeded"
						);
						if (condition) {
							if (condition.status === "True") {
								runStatus = "Succeeded";
							} else if (condition.status === "False") {
								runStatus = "Failed";
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
			return { status: "success", payload: taskruns };
		} catch (err) {
			return {
				status: "error",
				message: t(
					`Cannot get build & deploy task runs of the ${
						container.type
					} named '${container.name}''. ${
						err.response?.body?.message ?? err.message
					}`
				),
				stack: err.stack,
			};
		}
	}

	// Payload includes container info and environment info
	async getTaskRunLogs({ container, environment, taskRunName }) {
		try {
			// Get the pod information
			let resource = null;
			try {
				resource = await k8sCoreApi.readNamespacedPod(
					`${taskRunName}-pod`,
					"tekton-builds"
				);
			} catch (err) {
				// This means the TektonRun object has not created a pod yet
				return { status: "success", payload: [] };
			}

			const containerStatuses = resource.body.status.containerStatuses;
			if (!containerStatuses || containerStatuses.length === 0)
				return { status: "success", payload: [] };

			const setup = containerStatuses?.find(
				(entry) => entry.name === "step-setup"
			);
			const build = containerStatuses?.find(
				(entry) => entry.name === "step-build"
			);
			const push = containerStatuses?.find(
				(entry) => entry.name === "step-local-push"
			);
			const deploy = containerStatuses?.find(
				(entry) => entry.name === "step-deploy"
			);

			const stepPromises = [
				getStepInfo(`${taskRunName}-pod`, "step-setup", "setup", setup),
				getStepInfo(`${taskRunName}-pod`, "step-build", "build", build),
				getStepInfo(`${taskRunName}-pod`, "step-local-push", "push", push),
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

			console.log("***lastindex", lastIndex);
			// Set the status of all steps after lastIndex to pending
			if (lastIndex >= 0) {
				for (let i = lastIndex + 1; i < steps.length; i++) {
					if (steps[lastIndex].status === "success" && i === lastIndex + 1)
						steps[i].status = "running";
					else steps[i].status = "pending";
				}
			}

			return { status: "success", payload: steps };
		} catch (err) {
			return {
				status: "error",
				message: t(
					`Cannot get build & deploy logs of task run named '${taskRunName}' for ${
						container.type
					} named '${container.name}''. ${
						err.response?.body?.message ?? err.message
					}`
				),
				stack: err.stack,
			};
		}
	}

	// Payload includes container info, environment info and action
	async manageContainer(payload) {
		try {
			if (payload.container.type === "deployment") {
				await this.manageDeployment(payload);
			} else if (payload.container.type === "stateful set") {
				await this.manageStatefulSet(payload);
			} else if (payload.container.type === "cron job") {
				await this.manageCronJob(payload);
			} else if (payload.container.type === "knative service") {
				await this.manageKnativeService(payload);
			}

			return { status: "success" };
		} catch (err) {
			return {
				status: "error",
				message: t(
					`Cannot ${payload.action} the ${payload.container.type} named '${
						payload.container.name
					}''. ${err.response?.body?.message ?? err.message}`
				),
				stack: err.stack,
			};
		}
	}

	async manageKnativeService({
		container,
		environment,
		gitProvider,
		changes,
		action,
	}) {
		const name = container.iid;
		const namespace = environment.iid;
		if (action === "create") {
			try {
				await this.createTektonPipeline(container, environment, gitProvider);
			} catch (err) {
				await this.deleteTektonPipeline(container, environment, gitProvider);
				throw err;
			}
			await this.createKnativeService(container, namespace);
		} else if (action === "update") {
			if (changes.gitRepo) {
				await this.deleteTektonPipeline(container, environment, gitProvider);
				try {
					await this.createTektonPipeline(container, environment, gitProvider);
				} catch (err) {
					await this.deleteTektonPipeline(container, environment, gitProvider);
					throw err;
				}
			}
			await this.updateKnativeService(container, namespace);
			await this.updateIngress(
				container.networking,
				changes.containerPort,
				name,
				namespace,
				true
			);
			await this.updateCustomDomainIngress(
				container.networking,
				changes.containerPort,
				changes.customDomain,
				name,
				namespace,
				true
			);
		} else if (action === "delete") {
			await this.deleteKnativeService(name, namespace);
			await this.deleteIngress(`${name}-cluster`, namespace);
			await this.deleteCustomDomainIngress(`${name}-domain`, namespace);
			await this.deleteTektonPipeline(container, environment, gitProvider);
		}
	}

	// Definition is container
	async updateKnativeService(definition, namespace) {
		const payload = await getK8SResource(
			"KnativeService",
			definition.iid,
			namespace
		);
		const { metadata, spec } = payload.body;

		// Configure name, namespace and labels
		metadata.name = definition.iid;
		metadata.namespace = namespace;
		spec.template.metadata.labels.app = definition.iid;

		spec.template.metadata.annotations["autoscaling.knative.dev/class"] =
			definition.knativeConfig.scalingMetric === "concurrency" ||
			definition.knativeConfig.scalingMetric === "rps"
				? "kpa.autoscaling.knative.dev"
				: "hpa.autoscaling.knative.dev";
		spec.template.metadata.annotations["autoscaling.knative.dev/metric"] =
			definition.knativeConfig.scalingMetric;
		// "Concurrency" specifies a percentage value, e.g. "70"
		// "Requests per second" specifies an integer value,  e.g. "150"
		// "CPU" specifies the integer value in millicore, e.g. "100m"
		// "Memory" specifies the integer value in Mi, e.g. "75"
		if (definition.knativeConfig.scalingMetric === "concurrency") {
			delete spec.template.metadata.annotations[
				"autoscaling.knative.dev/target"
			];
			spec.template.metadata.annotations[
				"autoscaling.knative.dev/target-utilization-percentage"
			] = definition.knativeConfig.scalingMetricTarget.toString();
		} else {
			delete spec.template.metadata.annotations[
				"autoscaling.knative.dev/target-utilization-percentage"
			];
			spec.template.metadata.annotations["autoscaling.knative.dev/target"] =
				definition.knativeConfig.scalingMetricTarget.toString();
		}

		spec.template.metadata.annotations[
			"autoscaling.knative.dev/scale-down-delay"
		] = `${definition.knativeConfig.scaleDownDelay}s`;
		spec.template.metadata.annotations[
			"autoscaling.knative.dev/scale-to-zero-pod-retention-period"
		] = `${definition.knativeConfig.scaleToZeroPodRetentionPeriod}s`;

		spec.template.metadata.annotations[
			"autoscaling.knative.dev/initial-scale"
		] = definition.knativeConfig.initialScale.toString();
		spec.template.metadata.annotations["autoscaling.knative.dev/max-scale"] =
			definition.knativeConfig.minScale.toString();
		spec.template.metadata.annotations["autoscaling.knative.dev/min-scale"] =
			definition.knativeConfig.maxScale.toString();

		spec.template.spec.containerConcurrency =
			definition.knativeConfig.concurrency;

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
		const { readiness, liveness } = definition.probes;
		if (readiness.enabled) container.readinessProbe = getProbeConfig(readiness);
		else delete container.readinessProbe;

		if (liveness.enabled) container.livenessProbe = getProbeConfig(liveness);
		else delete container.livenessProbe;

		// Apply changes to the Knative Service
		await k8sCustomObjectApi.replaceNamespacedCustomObject(
			"serving.knative.dev",
			"v1",
			namespace,
			"services",
			definition.iid,
			payload.body
		);

		console.log(
			`Knative Service '${definition.iid}' in namespace '${namespace}' updated successfully`
		);
	}

	async manageCronJob({
		container,
		environment,
		gitProvider,
		changes,
		action,
	}) {
		const name = container.iid;
		const namespace = environment.iid;
		if (action === "create") {
			try {
				await this.createTektonPipeline(container, environment, gitProvider);
			} catch (err) {
				await this.deleteTektonPipeline(container, environment, gitProvider);
				throw err;
			}
			await this.createPVC(container.storageConfig, name, namespace);
			await this.createCronJob(container, namespace);
		} else if (action === "update") {
			if (changes.gitRepo) {
				await this.deleteTektonPipeline(container, environment, gitProvider);
				try {
					await this.createTektonPipeline(container, environment, gitProvider);
				} catch (err) {
					await this.deleteTektonPipeline(container, environment, gitProvider);
					throw err;
				}
			}
			await this.updateCronJob(container, namespace);
			await this.updatePVC(container.storageConfig, name, namespace);
		} else if (action === "delete") {
			await this.deleteCronJob(name, namespace);
			await this.deletePVC(name, namespace);
			await this.deleteTektonPipeline(container, environment, gitProvider);
		}
	}

	// Definition is container
	async updateCronJob(definition, namespace) {
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
		spec.failedJobsHistoryLimit =
			definition.cronJobConfig.failedJobsHistoryLimit;

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

	async manageStatefulSet({
		container,
		environment,
		gitProvider,
		changes,
		action,
	}) {
		const name = container.iid;
		const namespace = environment.iid;
		if (action === "create") {
			try {
				await this.createTektonPipeline(container, environment, gitProvider);
			} catch (err) {
				await this.deleteTektonPipeline(container, environment, gitProvider);
				throw err;
			}
			await this.createService(container.networking, name, namespace, true);
			// Statefulset creates its own PVCs, no need to make a call to createPVC
			await this.createStatefulSet(container, namespace);
		} else if (action === "update") {
			if (changes.gitRepo) {
				await this.deleteTektonPipeline(container, environment, gitProvider);
				try {
					await this.createTektonPipeline(container, environment, gitProvider);
				} catch (err) {
					await this.deleteTektonPipeline(container, environment, gitProvider);
					throw err;
				}
			}
			await this.updateStatefulSet(container, namespace);
			await this.updateService(container.networking, name, namespace);
			await this.updateIngress(
				container.networking,
				changes.containerPort,
				name,
				namespace
			);
			await this.updateCustomDomainIngress(
				container.networking,
				changes.containerPort,
				changes.customDomain,
				name,
				namespace
			);
			await this.updateTCPProxy(
				container.networking,
				changes.containerPort,
				name,
				namespace
			);
			await sleep(2000);
			await this.updateStatefulSetPVC(
				container.storageConfig,
				container.statefulSetConfig,
				name,
				namespace
			);
		} else if (action === "delete") {
			await this.deleteStatefulSet(name, namespace);
			await this.deleteService(name, namespace);
			await this.deleteIngress(`${name}-cluster`, namespace);
			await this.deleteCustomDomainIngress(`${name}-domain`, namespace);
			await this.deleteTCPProxy(
				container.networking.tcpProxy.enabled
					? container.networking.tcpProxy.publicPort
					: null
			);
			await this.deleteTektonPipeline(container, environment, gitProvider);
			await this.deleteStatefulSetPVC(
				container.storageConfig,
				container.statefulSetConfig,
				name,
				namespace
			);
		}
	}

	// Definition is container
	async updateStatefulSet(definition, namespace) {
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
		console.log(
			`StatefulSet '${definition.iid}' in namespace '${namespace}' updated successfully`
		);
	}

	async manageDeployment({
		container,
		environment,
		gitProvider,
		changes,
		action,
	}) {
		const name = container.iid;
		const namespace = environment.iid;
		if (action === "create") {
			try {
				await this.createTektonPipeline(container, environment, gitProvider);
			} catch (err) {
				await this.deleteTektonPipeline(container, environment, gitProvider);
				throw err;
			}
			await this.createPVC(container.storageConfig, name, namespace);
			await this.createService(container.networking, name, namespace);
			await this.createDeployment(container, namespace);
			await this.createHPA(container.deploymentConfig, name, namespace);
		} else if (action === "update") {
			if (changes.gitRepo) {
				await this.deleteTektonPipeline(container, environment, gitProvider);
				try {
					await this.createTektonPipeline(container, environment, gitProvider);
				} catch (err) {
					await this.deleteTektonPipeline(container, environment, gitProvider);
					throw err;
				}
			}
			await this.updateDeployment(container, namespace);
			await this.updatePVC(container.storageConfig, name, namespace);
			await this.updateService(container.networking, name, namespace);
			await this.updateHPA(container.deploymentConfig, name, namespace);
			await this.updateIngress(
				container.networking,
				changes.containerPort,
				name,
				namespace
			);
			await this.updateCustomDomainIngress(
				container.networking,
				changes.containerPort,
				changes.customDomain,
				name,
				namespace
			);
			await this.updateTCPProxy(
				container.networking,
				changes.containerPort,
				name,
				namespace
			);
		} else if (action === "delete") {
			await this.deleteDeployment(name, namespace);
			await this.deleteHPA(name, namespace);
			await this.deletePVC(name, namespace);
			await this.deleteService(name, namespace);
			await this.deleteIngress(`${name}-cluster`, namespace);
			await this.deleteCustomDomainIngress(`${name}-domain`, namespace);
			await this.deleteTCPProxy(
				container.networking.tcpProxy.enabled
					? container.networking.tcpProxy.publicPort
					: null
			);
			await this.deleteTektonPipeline(container, environment, gitProvider);
		}
	}

	// Definition is container
	async updateDeployment(definition, namespace) {
		const payload = await getK8SResource(
			"Deployment",
			definition.iid,
			namespace
		);
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
		console.log(
			`Deployment '${definition.iid}' in namespace '${namespace}' updated successfully`
		);
	}

	// Definition is deploymentConfig
	async createHPA(definition, name, namespace) {
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
		console.log(
			`HPA '${name}' in namespace '${namespace}' created successfully`
		);
	}

	// Definition is deploymentConfig
	async updateHPA(definition, name, namespace) {
		if (!definition.cpuMetric.enabled && !definition.cpuMetric.memoryMetric) {
			await this.deleteHPA(name, namespace);
			return;
		}

		const payload = await getK8SResource("HPA", name, namespace);
		if (!payload) {
			await this.createHPA(definition, name, namespace);
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
		console.log(
			`HPA '${name}' in namespace '${namespace}' updated successfully`
		);
	}

	// Definition is storageConfig
	async createPVC(definition, name, namespace) {
		if (!definition.enabled) return;

		const manifest = fs.readFileSync(`${__dirname}/manifests/pvc.yaml`, "utf8");
		const resource = yaml.load(manifest);
		const { metadata, spec } = resource;

		// Configure name, namespace and labels
		metadata.name = name;
		metadata.namespace = namespace;

		// Configure access modes
		spec.accessModes = definition.accessModes;
		// Configure volume capacity
		spec.resources.requests.storage =
			definition.sizeType === "mebibyte"
				? `${definition.size}Mi`
				: `${definition.size}Gi`;

		// Create the PVC
		await k8sCoreApi.createNamespacedPersistentVolumeClaim(namespace, resource);

		console.log(
			`PVC '${name}' in namespace '${namespace}' created successfully`
		);
	}

	// Definition is storageConfig
	async updatePVC(definition, name, namespace) {
		if (!definition.enabled) {
			await this.deletePVC(name, namespace);
			return;
		}

		const payload = await getK8SResource("PVC", name, namespace);
		if (!payload) {
			await this.createPVC(definition, name, namespace);
			return;
		}
		const { metadata, spec } = payload.body;

		// Configure name, namespace and labels
		metadata.name = name;
		metadata.namespace = namespace;

		// Configure access modes
		spec.accessModes = definition.accessModes;
		// Configure volume capacity
		spec.resources.requests.storage =
			definition.sizeType === "mebibyte"
				? `${definition.size}Mi`
				: `${definition.size}Gi`;

		// Update the PVC
		await k8sCoreApi.replaceNamespacedPersistentVolumeClaim(
			name,
			namespace,
			payload.body
		);
		console.log(
			`PVC '${name}' in namespace '${namespace}' updated successfully`
		);
	}

	// Definition is storageConfig
	async updateStatefulSetPVC(definition, statefulSetConfig, name, namespace) {
		if (!definition.enabled) return;

		// Get the list of PVCs in the namespace
		const { body } = await k8sCoreApi.listNamespacedPersistentVolumeClaim(
			namespace
		);
		// Filter the PVCs that belong to the stateful set
		const pvcList = body.items.filter((pvc) =>
			pvc.metadata.name.includes(name)
		);
		// For each PVC update the storage capacity
		for (const pvc of pvcList) {
			const { metadata, spec } = pvc;
			let storageIndex = -1;
			// Get the pod index from the PVC name
			const lastPart = metadata.name.split("-").pop();
			// Use a regular expression to find the last digit in the string
			const match = lastPart.match(/\d$/);
			if (match) {
				// Convert the last digit to an integer
				storageIndex = parseInt(match[0], 10);
			}

			if (
				storageIndex > statefulSetConfig.desiredReplicas - 1 &&
				statefulSetConfig.persistentVolumeClaimRetentionPolicy.whenScaled ===
					"Delete"
			) {
				await this.deletePVC(metadata.name, namespace);
			} else {
				// Configure volume capacity
				spec.resources.requests.storage =
					definition.sizeType === "mebibyte"
						? `${definition.size}Mi`
						: `${definition.size}Gi`;

				try {
					// Update the PVC
					await k8sCoreApi.replaceNamespacedPersistentVolumeClaim(
						metadata.name,
						namespace,
						pvc
					);
					console.log(
						`PVC '${metadata.name}' in namespace '${namespace}' updated successfully`
					);
				} catch (err) {
					console.error(
						`PVC '${metadata.name}' in namespace '${namespace}' cannot be updated. ${err.response?.body?.message}`
					);
				}
			}
		}
	}

	// Definition is storageConfig
	async deleteStatefulSetPVC(definition, statefulSetConfig, name, namespace) {
		if (
			!definition.enabled ||
			statefulSetConfig.persistentVolumeClaimRetentionPolicy.whenDeleted ===
				"Retain"
		)
			return;

		// Get the list of PVCs in the namespace
		const { body } = await k8sCoreApi.listNamespacedPersistentVolumeClaim(
			namespace
		);
		// Filter the PVCs that belong to the stateful set
		const pvcList = body.items.filter((pvc) =>
			pvc.metadata.name.includes(name)
		);
		// For each PVC update the storage capacity
		for (const pvc of pvcList) {
			const { metadata } = pvc;
			await this.deletePVC(metadata.name, namespace);
		}
	}

	// Definition is networking
	async createService(definition, name, namespace, isHeadless = false) {
		const manifest = fs.readFileSync(
			`${__dirname}/manifests/service.yaml`,
			"utf8"
		);
		const resource = yaml.load(manifest);
		const { metadata, spec } = resource;

		if (isHeadless) {
			spec.clusterIP = "None";
			delete spec.type;
		}

		// Configure name, namespace and labels
		metadata.name = name;
		metadata.namespace = namespace;

		// Configure target app
		spec.selector.app = name;
		// Set the port
		spec.ports[0].port = definition.containerPort;
		spec.ports[0].targetPort = definition.containerPort;

		// Create the service
		await k8sCoreApi.createNamespacedService(namespace, resource);

		console.log(
			`Service '${name}' in namespace '${namespace}' created successfully`
		);
	}

	// Definition is networking
	async updateService(definition, name, namespace) {
		const payload = await getK8SResource("Service", name, namespace);
		if (!payload) {
			await this.createService(definition, name, namespace);
			return;
		}
		const { metadata, spec } = payload.body;

		// Configure name, namespace and labels
		metadata.name = name;
		metadata.namespace = namespace;

		// Configure target app
		spec.selector.app = name;
		// Set the port
		spec.ports[0].port = definition.containerPort;
		spec.ports[0].targetPort = definition.containerPort;

		// Update the service
		await k8sCoreApi.replaceNamespacedService(name, namespace, payload.body);

		console.log(
			`Service '${name}' in namespace '${namespace}' updated successfully`
		);
	}

	// Definition is networking
	async createIngress(definition, name, namespace, isKnative = false) {
		// Get cluster info from the database
		const cluster = await getClusterRecord();

		const ingress = {
			apiVersion: "networking.k8s.io/v1",
			kind: "Ingress",
			metadata: {
				name: `${name}-cluster`,
				namespace: namespace,
				annotations: {
					"nginx.ingress.kubernetes.io/proxy-body-size": "500m",
					"nginx.ingress.kubernetes.io/proxy-connect-timeout": "6000",
					"nginx.ingress.kubernetes.io/proxy-send-timeout": "6000",
					"nginx.ingress.kubernetes.io/proxy-read-timeout": "6000",
					"nginx.ingress.kubernetes.io/proxy-next-upstream-timeout": "6000",
					"nginx.ingress.kubernetes.io/rewrite-target": "/$2",
				},
			},
			spec: {
				ingressClassName: "nginx",
				rules: [
					{
						http: {
							paths: [
								{
									path: `/${name}(/|$)(.*)`,
									pathType: "Prefix",
									backend: {
										service: {
											name: `${name}`,
											port: { number: definition.containerPort },
										},
									},
								},
							],
						},
					},
				],
			},
		};

		if (isKnative) {
			ingress.metadata.annotations[
				"nginx.ingress.kubernetes.io/upstream-vhost"
			] = `${name}.${namespace}.svc.cluster.local`;
		}

		// If cluster has SSL settings and custom domains then also add these to the API server ingress
		if (cluster) {
			if (cluster.enforceSSLAccess) {
				ingress.metadata.annotations[
					"nginx.ingress.kubernetes.io/ssl-redirect"
				] = "true";
				ingress.metadata.annotations[
					"nginx.ingress.kubernetes.io/force-ssl-redirect"
				] = "true";
			} else {
				ingress.metadata.annotations[
					"nginx.ingress.kubernetes.io/ssl-redirect"
				] = "false";
				ingress.metadata.annotations[
					"nginx.ingress.kubernetes.io/force-ssl-redirect"
				] = "false";
			}

			if (cluster.domains.length > 0) {
				await initializeClusterCertificateIssuer();
				ingress.metadata.annotations["cert-manager.io/cluster-issuer"] =
					"letsencrypt-clusterissuer";
				ingress.metadata.annotations["kubernetes.io/ingress.class"] = "nginx";

				ingress.spec.tls = cluster.domains.map((domainName) => {
					const secretName = helper.getCertSecretName();
					return {
						hosts: [domainName],
						secretName: secretName,
					};
				});

				for (const domainName of cluster.domains) {
					ingress.spec.rules.unshift({
						host: domainName,
						http: {
							paths: [
								{
									path: `/${name}(/|$)(.*)`,
									pathType: "Prefix",
									backend: {
										service: {
											name: `${name}`,
											port: { number: definition.containerPort },
										},
									},
								},
							],
						},
					});
				}
			}
		}

		try {
			// Create the ingress with the provided spec
			await k8sNetworkingApi.createNamespacedIngress(namespace, ingress);
			console.log(
				`Ingress '${name}-cluster' in namespace '${namespace}' created successfully`
			);
		} catch (err) {
			throw err;
		}
	}

	// Definition is networking
	async updateIngress(
		definition,
		isContainerPortChanged,
		name,
		namespace,
		isKnative = false
	) {
		if (definition.ingress.enabled) {
			const payload = await getK8SResource(
				"Ingress",
				`${name}-cluster`,
				namespace
			);
			if (!payload) {
				await this.createIngress(definition, name, namespace, isKnative);
				return;
			} else if (isContainerPortChanged) {
				// Update the ingress
				const { spec } = payload.body;
				spec.rules = spec.rules.map((entry) => {
					entry.http.paths = entry.http.paths.map((path) => {
						path.backend.service.port.number = definition.containerPort;
						return path;
					});

					return entry;
				});

				const requestOptions = {
					headers: { "Content-Type": "application/merge-patch+json" },
				};
				await k8sNetworkingApi.replaceNamespacedIngress(
					`${name}-cluster`,
					namespace,
					payload.body,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					requestOptions
				);

				console.log(
					`Ingress '${name}-cluster' in namespace '${namespace}' updated successfully`
				);
			}
		} else {
			await this.deleteIngress(`${name}-cluster`, namespace);
			return;
		}
	}

	// Definition is networking
	async createCustomDomainIngress(
		definition,
		name,
		namespace,
		isKnative = false
	) {
		// Get cluster info from the database
		const cluster = await getClusterRecord();

		const ingress = {
			apiVersion: "networking.k8s.io/v1",
			kind: "Ingress",
			metadata: {
				name: `${name}-domain`,
				namespace: namespace,
				annotations: {
					"nginx.ingress.kubernetes.io/proxy-body-size": "500m",
					"nginx.ingress.kubernetes.io/proxy-connect-timeout": "6000",
					"nginx.ingress.kubernetes.io/proxy-send-timeout": "6000",
					"nginx.ingress.kubernetes.io/proxy-read-timeout": "6000",
					"nginx.ingress.kubernetes.io/proxy-next-upstream-timeout": "6000",
				},
			},
			spec: {
				ingressClassName: "nginx",
				tls: [
					{
						hosts: [definition.customDomain.domain],
						secretName: helper.getCertSecretName(),
					},
				],
				rules: [
					{
						host: definition.customDomain.domain,
						http: {
							paths: [
								{
									path: "/",
									pathType: "Prefix",
									backend: {
										service: {
											name: `${name}`,
											port: { number: definition.containerPort },
										},
									},
								},
							],
						},
					},
				],
			},
		};

		if (isKnative) {
			ingress.metadata.annotations[
				"nginx.ingress.kubernetes.io/upstream-vhost"
			] = `${name}.${namespace}.svc.cluster.local`;
		}

		if (cluster.enforceSSLAccess) {
			ingress.metadata.annotations["nginx.ingress.kubernetes.io/ssl-redirect"] =
				"true";
			ingress.metadata.annotations[
				"nginx.ingress.kubernetes.io/force-ssl-redirect"
			] = "true";
		} else {
			ingress.metadata.annotations["nginx.ingress.kubernetes.io/ssl-redirect"] =
				"false";
			ingress.metadata.annotations[
				"nginx.ingress.kubernetes.io/force-ssl-redirect"
			] = "false";
		}

		await initializeClusterCertificateIssuer();
		ingress.metadata.annotations["cert-manager.io/cluster-issuer"] =
			"letsencrypt-clusterissuer";
		ingress.metadata.annotations["kubernetes.io/ingress.class"] = "nginx";

		// Create the ingress with the provided spec
		await k8sNetworkingApi.createNamespacedIngress(namespace, ingress);
		console.log(
			`Ingress '${name}-domain' in namespace '${namespace}' created successfully`
		);
	}

	// Definition is networking
	async updateCustomDomainIngress(
		definition,
		isContainerPortChanged,
		isCustomDomainChanged,
		name,
		namespace,
		isKnative = false
	) {
		if (definition.customDomain.enabled) {
			const payload = await getK8SResource(
				"Ingress",
				`${name}-domain`,
				namespace
			);
			if (!payload) {
				await this.createCustomDomainIngress(
					definition,
					name,
					namespace,
					isKnative
				);
				return;
			} else if (isContainerPortChanged || isCustomDomainChanged) {
				// Update the ingress
				const { spec } = payload.body;
				spec.tls[0].hosts = [definition.customDomain.domain];
				spec.rules = spec.rules.map((entry) => {
					entry.host = definition.customDomain.domain;
					entry.http.paths = entry.http.paths.map((path) => {
						path.backend.service.port.number = definition.containerPort;
						return path;
					});

					return entry;
				});

				const requestOptions = {
					headers: { "Content-Type": "application/merge-patch+json" },
				};
				await k8sNetworkingApi.replaceNamespacedIngress(
					`${name}-domain`,
					namespace,
					payload.body,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					requestOptions
				);

				console.log(
					`Ingress '${name}-domain' in namespace '${namespace}' updated successfully`
				);
			}
		} else {
			await this.deleteIngress(`${name}-domain`, namespace);
			return;
		}
	}

	// Definition is container
	async createDeployment(definition, namespace) {
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
		console.log(
			`Deployment '${definition.iid}' in namespace '${namespace}' created successfully`
		);
	}

	// Definition is container
	async createStatefulSet(definition, namespace) {
		const manifest = fs.readFileSync(
			`${__dirname}/manifests/statefulSet.yaml`,
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
		console.log(
			`StatefulSet '${definition.iid}' in namespace '${namespace}' created successfully`
		);
	}

	// Definition is container
	async createCronJob(definition, namespace) {
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
		spec.failedJobsHistoryLimit =
			definition.cronJobConfig.failedJobsHistoryLimit;
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
	async createKnativeService(definition, namespace) {
		const manifest = fs.readFileSync(
			`${__dirname}/manifests/knative.yaml`,
			"utf8"
		);
		const resource = yaml.load(manifest);
		const { metadata, spec } = resource;

		// Configure name, namespace and labels
		metadata.name = definition.iid;
		metadata.namespace = namespace;
		spec.template.metadata.labels.app = definition.iid;

		spec.template.metadata.annotations["autoscaling.knative.dev/class"] =
			definition.knativeConfig.scalingMetric === "concurrency" ||
			definition.knativeConfig.scalingMetric === "rps"
				? "kpa.autoscaling.knative.dev"
				: "hpa.autoscaling.knative.dev";
		spec.template.metadata.annotations["autoscaling.knative.dev/metric"] =
			definition.knativeConfig.scalingMetric;
		// "Concurrency" specifies a percentage value, e.g. "70"
		// "Requests per second" specifies an integer value,  e.g. "150"
		// "CPU" specifies the integer value in millicore, e.g. "100m"
		// "Memory" specifies the integer value in Mi, e.g. "75"
		if (definition.knativeConfig.scalingMetric === "concurrency") {
			delete spec.template.metadata.annotations[
				"autoscaling.knative.dev/target"
			];
			spec.template.metadata.annotations[
				"autoscaling.knative.dev/target-utilization-percentage"
			] = definition.knativeConfig.scalingMetricTarget.toString();
		} else {
			delete spec.template.metadata.annotations[
				"autoscaling.knative.dev/target-utilization-percentage"
			];
			spec.template.metadata.annotations["autoscaling.knative.dev/target"] =
				definition.knativeConfig.scalingMetricTarget.toString();
		}

		spec.template.metadata.annotations[
			"autoscaling.knative.dev/scale-down-delay"
		] = `${definition.knativeConfig.scaleDownDelay}s`;
		spec.template.metadata.annotations[
			"autoscaling.knative.dev/scale-to-zero-pod-retention-period"
		] = `${definition.knativeConfig.scaleToZeroPodRetentionPeriod}s`;

		spec.template.metadata.annotations[
			"autoscaling.knative.dev/initial-scale"
		] = definition.knativeConfig.initialScale.toString();
		spec.template.metadata.annotations["autoscaling.knative.dev/max-scale"] =
			definition.knativeConfig.minScale.toString();
		spec.template.metadata.annotations["autoscaling.knative.dev/min-scale"] =
			definition.knativeConfig.maxScale.toString();

		spec.template.spec.containerConcurrency =
			definition.knativeConfig.concurrency;

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
		const { readiness, liveness } = definition.probes;
		if (readiness.enabled) container.readinessProbe = getProbeConfig(readiness);
		else delete container.readinessProbe;

		if (liveness.enabled) container.livenessProbe = getProbeConfig(liveness);
		else delete container.livenessProbe;

		// Create the knative service
		await k8sCustomObjectApi.createNamespacedCustomObject(
			"serving.knative.dev",
			"v1",
			namespace,
			"services",
			resource
		);

		console.log(
			`Knative Service '${definition.iid}' in namespace '${namespace}' created successfully`
		);
	}

	async deleteDeployment(name, namespace) {
		if (!(await getK8SResource("Deployment", name, namespace))) return;

		try {
			await k8sAppsApi.deleteNamespacedDeployment(name, namespace);
			console.log(
				`Deployment '${name}' in namespace ${namespace} deleted successfully`
			);
		} catch (err) {
			console.error(
				`Error deleting deployment '${name}' in namespace ${namespace}. ${err.response?.body?.message}`
			);
		}
	}

	async deleteStatefulSet(name, namespace) {
		if (!(await getK8SResource("StatefulSet", name, namespace))) return;

		try {
			await k8sAppsApi.deleteNamespacedStatefulSet(name, namespace);
			console.log(
				`StatefulSet '${name}' in namespace ${namespace} deleted successfully`
			);
		} catch (err) {
			console.error(
				`Error deleting StatefulSet '${name}' in namespace ${namespace}. ${err.response?.body?.message}`
			);
		}
	}

	async deleteCronJob(name, namespace) {
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

	async deleteKnativeService(name, namespace) {
		if (!(await getK8SResource("KnativeService", name, namespace))) return;

		try {
			// Delete the deployment
			await k8sCustomObjectApi.deleteNamespacedCustomObject(
				"serving.knative.dev",
				"v1",
				namespace,
				"services",
				name
			);
			console.log(
				`Knative Service '${name}' in namespace ${namespace} deleted successfully`
			);
		} catch (err) {
			console.error(
				`Error deleting Knative Service '${name}' in namespace ${namespace}. ${err.response?.body?.message}`
			);
		}
	}

	async deletePVC(name, namespace) {
		if (!(await getK8SResource("PVC", name, namespace))) return;

		try {
			await k8sCoreApi.deleteNamespacedPersistentVolumeClaim(name, namespace);
			console.log(
				`PVC '${name}' in namespace ${namespace} deleted successfully`
			);
		} catch (err) {
			console.error(
				`Error deleting PVC '${name}' in namespace ${namespace}. ${err.response?.body?.message}`
			);
		}
	}

	async deleteService(name, namespace) {
		if (!(await getK8SResource("Service", name, namespace))) return;

		try {
			await k8sCoreApi.deleteNamespacedService(name, namespace);
			console.log(
				`Service '${name}' in namespace ${namespace} deleted successfully`
			);
		} catch (err) {
			console.error(
				`Error deleting service '${name}' in namespace ${namespace}. ${err.response?.body?.message}`
			);
		}
	}

	async deleteIngress(name, namespace) {
		if (!(await getK8SResource("Ingress", name, namespace))) return;

		try {
			await k8sNetworkingApi.deleteNamespacedIngress(name, namespace);
			console.log(
				`Ingress '${name}' in namespace ${namespace} deleted successfully`
			);
		} catch (err) {
			console.error(
				`Error deleting ingress '${name}' in namespace ${namespace}. ${err.response?.body?.message}`
			);
		}
	}

	async deleteCustomDomainIngress(name, namespace) {
		if (!(await getK8SResource("Ingress", name, namespace))) return;

		try {
			await k8sNetworkingApi.deleteNamespacedIngress(name, namespace);
			console.log(
				`Ingress '${name}' in namespace ${namespace} deleted successfully`
			);
		} catch (err) {
			console.error(
				`Error deleting ingress '${name}' in namespace ${namespace}. ${err.response?.body?.message}`
			);
		}
	}

	async deleteHPA(name, namespace) {
		if (!(await getK8SResource("HPA", name, namespace))) return;

		try {
			await k8sAutoscalingApi.deleteNamespacedHorizontalPodAutoscaler(
				name,
				namespace
			);
			console.log(
				`HPA '${name}' in namespace ${namespace} deleted successfully`
			);
		} catch (err) {
			console.error(
				`Error deleting HPA '${name}' in namespace ${namespace}. ${err.response?.body?.message}`
			);
		}
	}

	// Definition is networking
	async updateTCPProxy(definition, isContainerPortChanged, name, namespace) {
		const enabled = await this.isTCPProxyAlreadyEnabled(
			definition.tcpProxy.publicPort
		);
		if (definition.tcpProxy.enabled) {
			if (!enabled) {
				await this.createTCPProxy(
					name,
					namespace,
					definition.tcpProxy.publicPort,
					definition.containerPort
				);
				return;
			} else if (isContainerPortChanged) {
				await this.deleteTCPProxy(definition.tcpProxy.publicPort);
				await this.createTCPProxy(
					name,
					namespace,
					definition.tcpProxy.publicPort,
					definition.containerPort
				);
				return;
			}
		} else {
			if (enabled) await this.deleteTCPProxy(definition.tcpProxy.publicPort);
			return;
		}
	}

	async isTCPProxyAlreadyEnabled(publicPort) {
		if (!publicPort) return false;

		const resourceNamespace = "ingress-nginx";
		const deployments = await k8sAppsApi.listNamespacedDeployment(
			resourceNamespace
		);

		for (const deployment of deployments.body.items) {
			if (deployment.metadata.name.includes("ingress-nginx-controller")) {
				const deployName = deployment.metadata.name;
				const dply = await k8sAppsApi.readNamespacedDeployment(
					deployName,
					resourceNamespace
				);

				// To eliminate duplicates remove already exiting public port if any
				const exists = dply.body.spec.template.spec.containers[0].ports.find(
					(entry) => entry.containerPort.toString() === publicPort.toString()
				);

				if (exists) return true;
			}
		}

		return false;
	}

	/**
	 * Enables the TCP proxy for the service, mainly exposes the service to outside world through ingress at a specific port number
	 *
	 * @param {string} serviceName - The name of the service to enable TCP proxy.
	 * @param {number} portNumber - The port number to open.
	 * @param {number} resourcePort - The resource object port number (internal resource port number).
	 * @returns {Promise<void>} - A promise that resolves when the TCP proxy is enabled.
	 */
	async createTCPProxy(serviceName, namespace, portNumber, resourcePort) {
		/*  We need to patch below on ingress-nginx namespace:
                1. ConfigMap/tcp-services
                2. Service/ingress-nginx-controller
                3. Deployment/ingress-nginx-controller */

		const configMapName = "tcp-services";
		const resourceNamespace = "ingress-nginx";

		// get the backend service information
		let backendSvc = await getK8SResource("Service", serviceName, namespace);
		let protocol =
			backendSvc.body.spec.ports.find((entry) => entry.port === resourcePort)
				.protocol ?? "TCP";

		try {
			// patch configmap/tcp-service
			const cfgmap = await k8sCoreApi.readNamespacedConfigMap(
				configMapName,
				resourceNamespace
			);

			cfgmap.body.data = {
				...cfgmap.body.data,
				[portNumber]: `${namespace}/${serviceName}:${resourcePort}`,
			};

			await k8sCoreApi.replaceNamespacedConfigMap(
				configMapName,
				resourceNamespace,
				cfgmap.body
			);
		} catch (error) {
			if (
				error.body.code === 404 &&
				error.body.details.name == "tcp-services"
			) {
				const configMap = {
					apiVersion: "v1",
					kind: "ConfigMap",
					metadata: { name: configMapName },
					data: { [portNumber]: `${namespace}/${serviceName}:${resourcePort}` },
				};
				await k8sCoreApi.createNamespacedConfigMap(
					resourceNamespace,
					configMap
				);
			} else {
				throw error;
			}
		}

		// patch service/ingress-nginx-controller
		const portName = "proxied-tcp-" + portNumber;
		k8sCoreApi.listNamespacedService(resourceNamespace).then((res) => {
			res.body.items.forEach(async (service) => {
				if (service.metadata.name.includes("ingress-nginx-controller")) {
					const svcName = service.metadata.name;
					const svc = await k8sCoreApi.readNamespacedService(
						svcName,
						resourceNamespace
					);
					const newPort = {
						name: portName,
						port: portNumber,
						targetPort: portNumber,
						protocol: protocol,
					};
					// To eliminate duplicates remove already exiting public port if any
					svc.body.spec.ports = svc.body.spec.ports.filter(
						(svcPort) => svcPort.port.toString() !== portNumber.toString()
					);
					svc.body.spec.ports.push(newPort);
					await k8sCoreApi.replaceNamespacedService(
						svcName,
						resourceNamespace,
						svc.body
					);
				}
			});
		});

		// patch deployment/ingress-nginx-controller
		k8sAppsApi.listNamespacedDeployment(resourceNamespace).then((res) => {
			res.body.items.forEach(async (deployment) => {
				if (deployment.metadata.name.includes("ingress-nginx-controller")) {
					const deployName = deployment.metadata.name;
					const dply = await k8sAppsApi.readNamespacedDeployment(
						deployName,
						resourceNamespace
					);

					const configmapArg =
						"--tcp-services-configmap=ingress-nginx/tcp-services";
					const configmapArg2 =
						"--tcp-services-configmap=$(POD_NAMESPACE)/tcp-services";
					if (
						!dply.body.spec.template.spec.containers[0].args.includes(
							configmapArg
						) &&
						!dply.body.spec.template.spec.containers[0].args.includes(
							configmapArg2
						)
					) {
						dply.body.spec.template.spec.containers[0].args.push(configmapArg);
					}

					const newContainerPort = {
						containerPort: portNumber,
						hostPort: portNumber,
						protocol: protocol,
					};

					// To eliminate duplicates remove already exiting public port if any
					dply.body.spec.template.spec.containers[0].ports =
						dply.body.spec.template.spec.containers[0].ports.filter(
							(entry) =>
								entry.containerPort.toString() !== portNumber.toString()
						);
					dply.body.spec.template.spec.containers[0].ports.push(
						newContainerPort
					);
					await k8sAppsApi.replaceNamespacedDeployment(
						deployName,
						resourceNamespace,
						dply.body
					);
				}
			});
		});

		console.log(`TCP proxy port '${portNumber}' exposed successfully`);
	}

	async deleteTCPProxy(portNumber) {
		if (!portNumber) return;
		const configMapName = "tcp-services";
		const resourceNamespace = "ingress-nginx";

		// patch configmap/tcp-service
		const cfgmap = await k8sCoreApi.readNamespacedConfigMap(
			configMapName,
			resourceNamespace
		);
		delete cfgmap.body.data[portNumber];
		await k8sCoreApi.replaceNamespacedConfigMap(
			configMapName,
			resourceNamespace,
			cfgmap.body
		);

		// patch service/ingress-nginx-controller
		k8sCoreApi.listNamespacedService(resourceNamespace).then((res) => {
			res.body.items.forEach(async (service) => {
				if (service.metadata.name.includes("ingress-nginx-controller")) {
					const svcName = service.metadata.name;
					const svc = await k8sCoreApi.readNamespacedService(
						svcName,
						resourceNamespace
					);
					svc.body.spec.ports = svc.body.spec.ports.filter(
						(svcPort) => svcPort.port.toString() !== portNumber.toString()
					);
					await k8sCoreApi.replaceNamespacedService(
						svcName,
						resourceNamespace,
						svc.body
					);
				}
			});
		});

		// patch deployment/ingress-nginx-controller
		k8sAppsApi.listNamespacedDeployment(resourceNamespace).then((res) => {
			res.body.items.forEach(async (deployment) => {
				if (deployment.metadata.name.includes("ingress-nginx-controller")) {
					const deployName = deployment.metadata.name;
					const dply = await k8sAppsApi.readNamespacedDeployment(
						deployName,
						resourceNamespace
					);
					dply.body.spec.template.spec.containers[0].ports =
						dply.body.spec.template.spec.containers[0].ports.filter(
							(contPort) =>
								contPort.containerPort.toString() !== portNumber.toString()
						);
					await k8sAppsApi.replaceNamespacedDeployment(
						deployName,
						resourceNamespace,
						dply.body
					);
				}
			});
		});

		console.log(`TCP proxy port '${portNumber}' unexposed successfully`);
	}

	async deleteTCPProxyPorts(portNumbers) {
		if (!portNumbers || portNumbers.length === 0) return;
		const configMapName = "tcp-services";
		const resourceNamespace = "ingress-nginx";
		portNumbers = portNumbers.map((portNumber) => portNumber.toString());

		// patch configmap/tcp-service
		const cfgmap = await k8sCoreApi.readNamespacedConfigMap(
			configMapName,
			resourceNamespace
		);
		portNumbers.forEach((portNumber) => {
			delete cfgmap.body.data[portNumber];
		});
		await k8sCoreApi.replaceNamespacedConfigMap(
			configMapName,
			resourceNamespace,
			cfgmap.body
		);

		// patch service/ingress-nginx-controller
		k8sCoreApi.listNamespacedService(resourceNamespace).then((res) => {
			res.body.items.forEach(async (service) => {
				if (service.metadata.name.includes("ingress-nginx-controller")) {
					const svcName = service.metadata.name;
					const svc = await k8sCoreApi.readNamespacedService(
						svcName,
						resourceNamespace
					);
					svc.body.spec.ports = svc.body.spec.ports.filter(
						(svcPort) => !portNumbers.includes(svcPort.port.toString())
					);
					await k8sCoreApi.replaceNamespacedService(
						svcName,
						resourceNamespace,
						svc.body
					);
				}
			});
		});

		// patch deployment/ingress-nginx-controller
		k8sAppsApi.listNamespacedDeployment(resourceNamespace).then((res) => {
			res.body.items.forEach(async (deployment) => {
				if (deployment.metadata.name.includes("ingress-nginx-controller")) {
					const deployName = deployment.metadata.name;
					const dply = await k8sAppsApi.readNamespacedDeployment(
						deployName,
						resourceNamespace
					);
					dply.body.spec.template.spec.containers[0].ports =
						dply.body.spec.template.spec.containers[0].ports.filter(
							(contPort) =>
								!portNumbers.includes(contPort.containerPort.toString())
						);
					await k8sAppsApi.replaceNamespacedDeployment(
						deployName,
						resourceNamespace,
						dply.body
					);
				}
			});
		});

		console.log(
			`TCP proxy ports '${portNumbers.join(", ")}' unexposed successfully`
		);
	}

	// Container is container object and environment is environment object
	async createTektonPipeline(container, environment, gitProvider) {
		// If the repo is not connected then return
		if (!container.repo.connected || !gitProvider) return;

		const { repo } = container;
		const namespace = environment.iid;
		const gitRepoType = repo.type;
		const pipelineId = container.iid;
		const gitRepoUrl = repo.url;
		const gitPat = gitProvider.accessToken;
		const gitBranch = repo.branch;
		const gitSubPath = repo.path;
		const appKind = formatKubernetesName(container.type);
		const appName = container.iid;
		const dockerfile = repo.dockerfile;
		const containerImageName = container.iid;
		const manifest = fs.readFileSync(
			`${__dirname}/manifests/${gitRepoType}-pipeline.yaml`,
			"utf8"
		);
		const resources = k8s.loadAllYaml(manifest);

		const group = "triggers.tekton.dev";
		const version = "v1beta1";

		// Get cluster info from the database
		const cluster = await getClusterRecord();

		for (const resource of resources) {
			try {
				const { kind, metadata } = resource;

				if (metadata.namespace) {
					var resource_namespace = metadata.namespace;
				}

				var resourceNameSuffix = "-" + pipelineId;
				resource.metadata.name += resourceNameSuffix;

				switch (kind) {
					case "ServiceAccount":
						await k8sCoreApi.createNamespacedServiceAccount(
							resource_namespace,
							resource
						);
						break;
					case "Secret":
						var secretToken = crypto.randomBytes(20).toString("hex");
						resource.stringData.secretToken = secretToken;
						await k8sCoreApi.createNamespacedSecret(
							resource_namespace,
							resource
						);
						break;
					case "ClusterRoleBinding":
						resource.subjects[0].name += resourceNameSuffix;
						await k8sAuthApi.createClusterRoleBinding(resource);
						break;
					case "RoleBinding":
						resource.subjects[0].name += resourceNameSuffix;
						await k8sAuthApi.createNamespacedRoleBinding(
							resource_namespace,
							resource
						);
						break;
					case "Ingress":
						resource.spec.rules[0].http.paths[0].path =
							"/tekton-" + pipelineId + "(/|$)(.*)";
						resource.spec.rules[0].http.paths[0].backend.service.name +=
							resourceNameSuffix;
						// If cluster has SSL settings and custom domains then also add these to the API server ingress
						if (cluster) {
							if (cluster.enforceSSLAccess) {
								resource.metadata.annotations[
									"nginx.ingress.kubernetes.io/ssl-redirect"
								] = "true";
								resource.metadata.annotations[
									"nginx.ingress.kubernetes.io/force-ssl-redirect"
								] = "true";
							} else {
								resource.metadata.annotations[
									"nginx.ingress.kubernetes.io/ssl-redirect"
								] = "false";
								resource.metadata.annotations[
									"nginx.ingress.kubernetes.io/force-ssl-redirect"
								] = "false";
							}

							if (cluster.domains.length > 0) {
								await initializeClusterCertificateIssuer();
								resource.metadata.annotations[
									"cert-manager.io/cluster-issuer"
								] = "letsencrypt-clusterissuer";
								resource.metadata.annotations["kubernetes.io/ingress.class"] =
									"nginx";

								resource.spec.tls = cluster.domains.map((domainName) => {
									const secretName = helper.getCertSecretName();
									return {
										hosts: [domainName],
										secretName: secretName,
									};
								});

								for (const domainName of cluster.domains) {
									resource.spec.rules.unshift({
										host: domainName,
										http: {
											paths: [
												{
													path: "/tekton-" + pipelineId + "(/|$)(.*)",
													pathType: "ImplementationSpecific",
													backend: {
														service: {
															name: `el-github-listener-${pipelineId}`,
															port: { number: 8080 },
														},
													},
												},
											],
										},
									});
								}
							}
						}
						await k8sNetworkingApi.createNamespacedIngress(
							resource_namespace,
							resource
						);
						break;
					case "EventListener":
						resource.spec.triggers[0].interceptors[0].params[0].value.secretName +=
							resourceNameSuffix;
						resource.spec.triggers[0].interceptors[1].params[0].value = `body.ref == 'refs/heads/${gitBranch}'`;
						resource.spec.triggers[0].bindings[0].ref += resourceNameSuffix;
						resource.spec.triggers[0].template.ref += resourceNameSuffix;
						resource.spec.resources.kubernetesResource.spec.template.spec.serviceAccountName +=
							resourceNameSuffix;
						if (gitSubPath != "/") {
							resource.spec.triggers[0].interceptors[1].params[1].name =
								"filter";
							// remove leading slash, if exists
							var path = gitSubPath.replace(/^\/+/, "");
							resource.spec.triggers[0].interceptors[1].params[1].value = `body.commits.all(c, c.modified.exists(m, m.startsWith("${path}")) || c.added.exists(a, a.startsWith("${path}")) || c.removed.exists(r, r.startsWith("${path}")))`;
						} else {
							delete resource.spec.triggers[0].interceptors[1].params[1];
						}
						await k8sCustomObjectApi.createNamespacedCustomObject(
							group,
							version,
							resource_namespace,
							"eventlisteners",
							resource
						);
						break;
					case "TriggerBinding":
						resource.spec.params[0].value = appKind;
						resource.spec.params[1].value = appName;
						resource.spec.params[2].value = namespace;
						resource.spec.params[3].value =
							"local-registry." + agnostNamespace + ":5000";
						resource.spec.params[4].value = gitPat;
						resource.spec.params[5].value = gitBranch;
						resource.spec.params[6].value = gitSubPath.replace(/^\/+/, ""); // remove leading slash, if exists
						resource.spec.params[7].value = containerImageName;
						resource.spec.params[8].value = dockerfile.replace(/^\/+/, ""); // remove leading slash, if exists
						await k8sCustomObjectApi.createNamespacedCustomObject(
							group,
							version,
							resource_namespace,
							"triggerbindings",
							resource
						);
						break;
					case "TriggerTemplate":
						let secretName = "regcred-local-registry";
						resource.spec.resourcetemplates[0].spec.taskSpec.volumes[0].secret.secretName =
							secretName;
						resource.spec.resourcetemplates[0].spec.serviceAccountName +=
							resourceNameSuffix;
						await k8sCustomObjectApi.createNamespacedCustomObject(
							group,
							version,
							resource_namespace,
							"triggertemplates",
							resource
						);
						break;
					default:
						console.log(`!!! Skipping: ${kind}`);
				}
				console.log(`${kind} ${resource.metadata.name} created...`);
			} catch (err) {
				console.error(
					`Error applying tekton pipeline resource ${resource.kind} ${resource.metadata.name}...`,
					err.body?.message ?? err
				);
				throw err;
			}
		}

		let webhookUrl = "";
		let sslVerification = false;
		if (cluster.domains.length) {
			{
				webhookUrl = "https://" + cluster.domains[0] + "/tekton-" + pipelineId;
				sslVerification = true;
			}
		} else {
			const cluster = await getClusterRecord();
			webhookUrl = "http://" + cluster.ips[0] + "/tekton-" + pipelineId;
			sslVerification = false;
		}

		let webHookId = null;
		switch (gitRepoType) {
			case "github":
				webHookId = await createGithubWebhook(
					gitPat,
					gitRepoUrl,
					webhookUrl,
					secretToken,
					sslVerification
				);
				break;
			case "gitlab":
				webHookId = await createGitlabWebhook(
					gitPat,
					gitRepoUrl,
					webhookUrl,
					secretToken,
					gitBranch,
					sslVerification
				);
				break;
			default:
				throw new AgnostError("Unknown repo type: " + gitRepoType);
		}

		if (webHookId) {
			// At this stage we have successfully created the webhook, update the container database with the webhook id
			axios
				.post(
					helper.getPlatformUrl() + "/v1/telemetry/set-webhook",
					{ container, webHookId },
					{
						headers: {
							Authorization: process.env.MASTER_TOKEN,
							"Content-Type": "application/json",
						},
					}
				)
				.catch((error) => {});
		}
	}

	async deleteTektonPipeline(container, environment, gitProvider) {
		const { repo } = container;
		const gitRepoType = repo.type;
		const pipelineId = container.iid;
		const gitRepoUrl = repo.url;
		const hookId = repo.webHookId;
		const gitPat = gitProvider?.accessToken;
		const manifest = fs.readFileSync(
			`${__dirname}/manifests/${gitRepoType}-pipeline.yaml`,
			"utf8"
		);
		const resources = k8s.loadAllYaml(manifest);

		const group = "triggers.tekton.dev";
		const version = "v1beta1";

		for (const resource of resources) {
			try {
				const { kind, metadata } = resource;

				if (metadata.namespace) {
					var resource_namespace = metadata.namespace;
				}

				var resourceNameSuffix = "-" + pipelineId;
				resource.metadata.name += resourceNameSuffix;

				switch (kind) {
					case "ServiceAccount":
						await k8sCoreApi.deleteNamespacedServiceAccount(
							resource.metadata.name,
							resource_namespace
						);
						break;
					case "Secret":
						await k8sCoreApi.deleteNamespacedSecret(
							resource.metadata.name,
							resource_namespace
						);
						break;
					case "ClusterRoleBinding":
						await k8sAuthApi.deleteClusterRoleBinding(resource.metadata.name);
						break;
					case "RoleBinding":
						await k8sAuthApi.deleteNamespacedRoleBinding(
							resource.metadata.name,
							resource_namespace
						);
						break;
					case "Ingress":
						await k8sNetworkingApi.deleteNamespacedIngress(
							resource.metadata.name,
							resource_namespace
						);
						break;
					case "EventListener":
						await k8sCustomObjectApi.deleteNamespacedCustomObject(
							group,
							version,
							resource_namespace,
							"eventlisteners",
							resource.metadata.name
						);
						break;
					case "TriggerBinding":
						await k8sCustomObjectApi.deleteNamespacedCustomObject(
							group,
							version,
							resource_namespace,
							"triggerbindings",
							resource.metadata.name
						);
						break;
					case "TriggerTemplate":
						await k8sCustomObjectApi.deleteNamespacedCustomObject(
							group,
							version,
							resource_namespace,
							"triggertemplates",
							resource.metadata.name
						);
						break;
					default:
						console.log(`!!! Skipping: ${kind}`);
				}
				console.log(`${kind} ${resource.metadata.name} deleted...`);
			} catch (err) {
				console.error(
					`Error deleting tekton pipeline resource ${resource.kind} ${resource.metadata.name}...`,
					err.body?.message ?? err
				);
			}
		}

		switch (gitRepoType) {
			case "github":
				await deleteGithubWebhook(gitPat, gitRepoUrl, hookId);
				break;
			case "gitlab":
				await deleteGitlabWebhook(gitPat, gitRepoUrl, hookId);
				break;
			default:
				throw new AgnostError("Unknown repo type: " + gitRepoType);
		}

		// At this stage we have successfully deleted the webhook, update the container database to remove the webhook id
		axios
			.post(
				helper.getPlatformUrl() + "/v1/telemetry/remove-webhook",
				{ container },
				{
					headers: {
						Authorization: process.env.MASTER_TOKEN,
						"Content-Type": "application/json",
					},
				}
			)
			.catch((error) => {
				console.log("Error updating github webhook in platform-core", error);
			});
	}
}

function getProbeConfig(config) {
	const probe = {
		initialDelaySeconds: config.initialDelaySeconds,
		periodSeconds: config.periodSeconds,
		timeoutSeconds: config.timeoutSeconds,
		failureThreshold: config.failureThreshold,
	};

	if (config.checkMechanism === "exec") {
		return {
			exec: { command: config.execCommand.split("\n") },
			...probe,
		};
	} else if (config.checkMechanism === "httpGet") {
		return {
			httpGet: { path: config.httpPath, port: config.httpPort },
			...probe,
		};
	} else {
		return {
			tcpSocket: { port: config.tcpPort },
			...probe,
		};
	}
}

async function getK8SResource(kind, name, namespace) {
	try {
		switch (kind) {
			case "Namespace":
				return await k8sCoreApi.readNamespace(name);
			case "Deployment":
				return await k8sAppsApi.readNamespacedDeployment(name, namespace);
			case "StatefulSet":
				return await k8sAppsApi.readNamespacedStatefulSet(name, namespace);
			case "CronJob":
				return await k8sBatchApi.readNamespacedCronJob(name, namespace);
			case "Job":
				return await k8sBatchApi.readNamespacedJob(name, namespace);
			case "KnativeService":
				return await k8sCustomObjectApi.getNamespacedCustomObject(
					"serving.knative.dev",
					"v1",
					namespace,
					"services",
					name
				);
			case "HPA":
				return await k8sAutoscalingApi.readNamespacedHorizontalPodAutoscaler(
					name,
					namespace
				);
			case "Service":
				return await k8sCoreApi.readNamespacedService(name, namespace);
			case "Ingress":
				return await k8sNetworkingApi.readNamespacedIngress(name, namespace);
			case "ServiceAccount":
				return await k8sCoreApi.readNamespacedServiceAccount(name, namespace);
			case "Secret":
				return await k8sCoreApi.readNamespacedSecret(name, namespace);
			case "ConfigMap":
				return await k8sCoreApi.readNamespacedConfigMap(name, namespace);
			case "PVC":
				return await k8sCoreApi.readNamespacedPersistentVolumeClaim(
					name,
					namespace
				);
			default:
				console.log(`Skipping: ${kind}`);
				return null;
		}
	} catch (err) {
		return null;
	}
}

async function applyManifest(localRegistryEnabled) {
	const manifest = fs.readFileSync(
		`${__dirname}/manifests/tekton-infra.yaml`,
		"utf8"
	);
	const resources = k8s.loadAllYaml(manifest);

	for (const resource of resources) {
		try {
			const { kind, metadata } = resource;

			if (metadata.namespace) {
				var resourceNamespace = metadata.namespace;
			}

			switch (kind) {
				case "Namespace":
					await k8sCoreApi.createNamespace(resource);
					break;
				case "Deployment":
					await k8sAppsApi.createNamespacedDeployment(
						resourceNamespace,
						resource
					);
					break;
				case "Service":
					await k8sCoreApi.createNamespacedService(resourceNamespace, resource);
					break;
				case "ServiceAccount":
					await k8sCoreApi.createNamespacedServiceAccount(
						resourceNamespace,
						resource
					);
					break;
				case "Secret":
					await k8sCoreApi.createNamespacedSecret(resourceNamespace, resource);
					break;
				case "ConfigMap":
					await k8sCoreApi.createNamespacedConfigMap(
						resourceNamespace,
						resource
					);
					break;
				case "ClusterRole":
					await k8sAuthApi.createClusterRole(resource);
					break;
				case "ClusterRoleBinding":
					await k8sAuthApi.createClusterRoleBinding(resource);
					break;
				case "Role":
					await k8sAuthApi.createNamespacedRole(resourceNamespace, resource);
					break;
				case "RoleBinding":
					await k8sAuthApi.createNamespacedRoleBinding(
						resourceNamespace,
						resource
					);
					break;
				case "MutatingWebhookConfiguration":
					await k8sAdmissionApi.createMutatingWebhookConfiguration(resource);
					break;
				case "ValidatingWebhookConfiguration":
					await k8sAdmissionApi.createValidatingWebhookConfiguration(resource);
					break;
				case "HorizontalPodAutoscaler":
					await k8sAutoscalingApi.createNamespacedHorizontalPodAutoscaler(
						resourceNamespace,
						resource
					);
					break;
				case "ClusterInterceptor":
					await k8sCustomObjectApi.createClusterCustomObject(
						"triggers.tekton.dev",
						"v1alpha1",
						"clusterinterceptors",
						resource
					);
					break;
				case "CronJob":
					await k8sBatchApi.createNamespacedCronJob(
						resourceNamespace,
						resource
					);
					break;
				default:
					console.log(`Skipping: ${kind}`);
			}
			console.log(`${kind} ${resource.metadata.name} created...`);
		} catch (err) {
			console.error(
				`Error applying resource ${resource.kind} ${resource.metadata.name}:`,
				err
			);
			throw new AgnostError(err.body?.message);
		}
	}

	if (localRegistryEnabled) {
		await deployLocalRegistry();

		// copy regcred secret from the app's namespace
		try {
			const secretName = "regcred-local-registry";
			const resource_namespace = "tekton-builds";
			const regcred = await k8sCoreApi.readNamespacedSecret(
				secretName,
				agnostNamespace
			);
			regcred.body.metadata.namespace = resource_namespace;
			delete regcred.body.metadata.resourceVersion;
			await k8sCoreApi.createNamespacedSecret(resource_namespace, regcred.body);
			console.log("Regcred secret " + secretName + " is copied");
		} catch (err) {
			// do nothing, it might be a second time copy!
		}
	}

	return "success";
}

async function deleteManifest(localRegistryEnabled) {
	const manifest = fs.readFileSync(
		`${__dirname}/manifests/tekton-infra.yaml`,
		"utf8"
	);
	const resources = k8s.loadAllYaml(manifest);

	for (const resource of resources.reverse()) {
		const { kind, metadata } = resource;

		if (metadata.namespace) {
			var resourceNamespace = metadata.namespace;
		}

		try {
			switch (kind) {
				case "Namespace":
					await k8sCoreApi.deleteNamespace(resource.metadata.name);
					break;
				case "Deployment":
					await k8sAppsApi.deleteNamespacedDeployment(
						resource.metadata.name,
						resourceNamespace
					);
					break;
				case "Service":
					await k8sCoreApi.deleteNamespacedService(
						resource.metadata.name,
						resourceNamespace
					);
					break;
				case "ServiceAccount":
					await k8sCoreApi.deleteNamespacedServiceAccount(
						resource.metadata.name,
						resourceNamespace
					);
					break;
				case "Secret":
					await k8sCoreApi.deleteNamespacedSecret(
						resource.metadata.name,
						resourceNamespace
					);
					break;
				case "ConfigMap":
					await k8sCoreApi.deleteNamespacedConfigMap(
						resource.metadata.name,
						resourceNamespace
					);
					break;
				case "ClusterRole":
					await k8sAuthApi.deleteClusterRole(resource.metadata.name);
					break;
				case "ClusterRoleBinding":
					await k8sAuthApi.deleteClusterRoleBinding(resource.metadata.name);
					break;
				case "Role":
					await k8sAuthApi.deleteNamespacedRole(
						resource.metadata.name,
						resourceNamespace
					);
					break;
				case "RoleBinding":
					await k8sAuthApi.deleteNamespacedRoleBinding(
						resource.metadata.name,
						resourceNamespace
					);
					break;
				case "ClusterInterceptor":
					await k8sCustomObjectApi.deleteClusterCustomObject(
						"triggers.tekton.dev",
						"v1alpha1",
						"clusterinterceptors",
						resource.metadata.name
					);
					break;
				case "MutatingWebhookConfiguration":
					await k8sAdmissionApi.deleteMutatingWebhookConfiguration(
						resource.metadata.name
					);
					break;
				case "ValidatingWebhookConfiguration":
					await k8sAdmissionApi.deleteValidatingWebhookConfiguration(
						resource.metadata.name
					);
					break;
				case "HorizontalPodAutoscaler":
					await k8sAutoscalingApi.deleteNamespacedHorizontalPodAutoscaler(
						resource.metadata.name,
						resourceNamespace
					);
					break;
				case "CronJob":
					await k8sBatchApi.deleteNamespacedCronJob(
						resource.metadata.name,
						resourceNamespace
					);
					break;
				default:
					console.log(`Skipping: ${kind}`);
			}
			console.log(`${kind} ${resource.metadata.name} deleted...`);
		} catch (err) {}
	}

	if (localRegistryEnabled) {
		await removeLocalRegistry();

		// Delete regcred secret
		try {
			const secretName = "regcred-local-registry";
			const resource_namespace = "tekton-builds";
			await k8sCoreApi.deleteNamespacedSecret(secretName, resource_namespace);
			console.log("Deleted regcred secret " + secretName);
		} catch (err) {}
	}

	return "success";
}

async function deployLocalRegistry() {
	const manifest = fs.readFileSync(
		`${__dirname}/manifests/local-registry.yaml`,
		"utf8"
	);
	const resources = k8s.loadAllYaml(manifest);

	for (const resource of resources) {
		try {
			const { kind } = resource;

			switch (kind) {
				case "Deployment":
					await k8sAppsApi.createNamespacedDeployment(
						agnostNamespace,
						resource
					);
					break;
				case "Service":
					await k8sCoreApi.createNamespacedService(agnostNamespace, resource);
					break;
				case "ServiceAccount":
					await k8sCoreApi.createNamespacedServiceAccount(
						agnostNamespace,
						resource
					);
					break;
				case "Secret":
					const adminPassword = crypto.randomBytes(20).toString("hex");
					resource.stringData.htpasswd = await generateHtpasswd(
						"admin",
						adminPassword
					);

					// this will create the secret for Zot to operate
					await k8sCoreApi.createNamespacedSecret(agnostNamespace, resource);

					// this will create docker credentials for kaniko to push images
					let auth = Buffer.from("admin:" + adminPassword);
					const secretData = Buffer.from(
						'{"auths":{"local-registry.default:5000":{"username":"admin","password":"' +
							adminPassword +
							'","auth":"' +
							auth.toString("base64") +
							'"}}}'
					);
					const regcredSecret = {
						apiVersion: "v1",
						data: { ".dockerconfigjson": secretData.toString("base64") },
						kind: "Secret",
						metadata: {
							name: "regcred-local-registry",
							namespace: agnostNamespace,
						},
						type: "kubernetes.io/dockerconfigjson",
					};
					await k8sCoreApi.createNamespacedSecret(
						agnostNamespace,
						regcredSecret
					);
					break;
				case "ConfigMap":
					await k8sCoreApi.createNamespacedConfigMap(agnostNamespace, resource);
					break;
				default:
					console.log(`Skipping: ${kind}`);
			}
			console.log(`${kind} ${resource.metadata.name} created...`);
		} catch (err) {
			console.error("Error applying resource:", resource);
			console.error("Error applying resource:", err);

			throw new AgnostError(err.body?.message);
		}
	}

	await createS3Bucket();

	return "success";
}

async function removeLocalRegistry() {
	try {
		await k8sAppsApi.deleteNamespacedDeployment(
			"local-registry",
			agnostNamespace
		);
		console.log("Deployment local-registry deleted...");
	} catch (err) {}
	try {
		await k8sCoreApi.deleteNamespacedService("local-registry", agnostNamespace);
		console.log("Service local-registry deleted...");
	} catch (err) {}
	try {
		await k8sCoreApi.deleteNamespacedSecret(
			"local-registry-htpasswd",
			agnostNamespace
		);
		console.log("Secret local-registry-htpasswd deleted...");
	} catch (err) {}
	try {
		await k8sCoreApi.deleteNamespacedSecret(
			"regcred-local-registry",
			agnostNamespace
		);
		console.log("Secret regcred-local-registry deleted...");
	} catch (err) {}
	try {
		await k8sCoreApi.deleteNamespacedConfigMap(
			"local-registry-config",
			agnostNamespace
		);
		console.log("ConfigMap local-registry-config deleted...");
	} catch (err) {}
	try {
		await k8sCoreApi.deleteNamespacedServiceAccount(
			"local-registry",
			agnostNamespace
		);
		console.log("ServiceAccount local-registry deleted...");
	} catch (err) {}

	await deleteS3Bucket();

	return "sucess";
}

async function createS3Bucket() {
	const minioClient = new minio.Client({
		endPoint: process.env.MINIO_ENDPOINT,
		port: Number(process.env.MINIO_PORT),
		useSSL: false,
		accessKey: process.env.MINIO_ACCESS_KEY,
		secretKey: process.env.MINIO_SECRET_KEY,
	});

	try {
		await minioClient.makeBucket("zot-storage");
		console.log("Bucket zot-storage is created on MinIO...");
	} catch (err) {
		// Ignore error if the bucket already exists
		if (
			err.code === "BucketAlreadyOwnedByYou" ||
			err.code === "BucketAlreadyOwned"
		) {
			console.log(`Bucket zot-storage already exists.`);
		} else {
			console.error("Cannot create the bucket:", err);
			throw new AgnostError(err.body?.message ?? err.message);
		}
	}
}

async function deleteS3Bucket() {
	const minioClient = new minio.Client({
		endPoint: process.env.MINIO_ENDPOINT,
		port: Number(process.env.MINIO_PORT),
		useSSL: false,
		accessKey: process.env.MINIO_ACCESS_KEY,
		secretKey: process.env.MINIO_SECRET_KEY,
	});

	try {
		await minioClient.removeBucket("zot-storage");
		console.log("Bucket zot-storage is deleted from MinIO...");
	} catch (err) {
		console.error("Cannot delete the bucket:", err);
	}
}

function hashPassword(password) {
	return new Promise((resolve, reject) => {
		bcrypt.hash(password, 10, (err, hash) => {
			if (err) {
				reject(err);
			} else {
				resolve(hash);
			}
		});
	});
}

async function generateHtpasswd(username, password) {
	try {
		// Generate bcrypt hash for the password using await
		const hash = await hashPassword(password);
		return `${username}:${hash}`;
	} catch (error) {
		console.error("Error generating bcrypt hash:", error);
		throw new AgnostError(error.message);
	}
}

/**
 * Retrieves the cluster record from the database.
 * @returns {Promise<Object>} The cluster record.
 */
export async function getClusterRecord() {
	// Get cluster configuration
	return await clsCtrl.getOneByQuery({
		clusterAccesssToken: process.env.CLUSTER_ACCESS_TOKEN,
	});
}

/**
 * Initializes the certificate issuer available across all namespaces.
 * This function checks if the certificate issuer already exists, and if not, creates it.
 * @returns {Promise<void>} A promise that resolves when the initialization is complete.
 */
async function initializeClusterCertificateIssuer() {
	try {
		// Check to see if we have the certificate issuer already
		await k8sCustomObjectApi.getClusterCustomObject(
			"cert-manager.io",
			"v1",
			"clusterissuers",
			"letsencrypt-clusterissuer"
		);

		return;
	} catch (err) {
		// If we get a 404, we need to create the issuer
		if (err.statusCode === 404) {
			const clusterIssuer = {
				apiVersion: "cert-manager.io/v1",
				kind: "ClusterIssuer",
				metadata: {
					name: "letsencrypt-clusterissuer",
				},
				spec: {
					acme: {
						privateKeySecretRef: {
							name: "letsencrypt-clusterissuer-key",
						},
						server: "https://acme-v02.api.letsencrypt.org/directory",
						solvers: [
							{
								http01: {
									ingress: {
										ingressClassName: "nginx",
									},
								},
							},
						],
					},
				},
			};

			await k8sCustomObjectApi.createClusterCustomObject(
				"cert-manager.io",
				"v1",
				"clusterissuers",
				clusterIssuer
			);
		}
	}
}

/**
 * Adds a custom domain to a container ingress.
 */
export async function addClusterCustomDomain(
	containeriid,
	namespace,
	domainName,
	containerPort,
	enforceSSLAccess
) {
	try {
		await initializeClusterCertificateIssuer();
		const ingress = await getK8SResource(
			"Ingress",
			`${containeriid}-cluster`,
			namespace
		);
		if (!ingress) return;

		if (enforceSSLAccess) {
			ingress.body.metadata.annotations[
				"nginx.ingress.kubernetes.io/ssl-redirect"
			] = "true";
			ingress.body.metadata.annotations[
				"nginx.ingress.kubernetes.io/force-ssl-redirect"
			] = "true";
		} else {
			ingress.body.metadata.annotations[
				"nginx.ingress.kubernetes.io/ssl-redirect"
			] = "false";
			ingress.body.metadata.annotations[
				"nginx.ingress.kubernetes.io/force-ssl-redirect"
			] = "false";
		}

		ingress.body.metadata.annotations["cert-manager.io/cluster-issuer"] =
			"letsencrypt-clusterissuer";
		ingress.body.metadata.annotations["kubernetes.io/ingress.class"] = "nginx";

		if (ingress.body.spec.tls) {
			ingress.body.spec.tls.push({
				hosts: [domainName],
				secretName: helper.getCertSecretName(),
			});
		} else {
			ingress.body.spec.tls = [
				{
					hosts: [domainName],
					secretName: helper.getCertSecretName(),
				},
			];
		}

		ingress.body.spec.rules = ingress.body.spec.rules ?? [];
		ingress.body.spec.rules.unshift({
			host: domainName,
			http: {
				paths: [
					{
						path: `/${containeriid}(/|$)(.*)`,
						pathType: "Prefix",
						backend: {
							service: {
								name: `${containeriid}`,
								port: { number: containerPort },
							},
						},
					},
				],
			},
		});

		const requestOptions = {
			headers: { "Content-Type": "application/merge-patch+json" },
		};
		await k8sNetworkingApi.patchNamespacedIngress(
			`${containeriid}-cluster`,
			namespace,
			ingress.body,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			requestOptions
		);
	} catch (err) {
		logger.error(
			`Cannot add custom domain '${domainName}' to ingress '${containeriid}-cluster'`,
			{ details: err }
		);
	}
}

/**
 * Deletes custom domains from a container's ingress.
 */
export async function deleteClusterCustomDomains(
	containeriid,
	namespace,
	domainNames
) {
	try {
		const ingress = await getK8SResource(
			"Ingress",
			`${containeriid}-cluster`,
			namespace
		);
		if (!ingress) return;

		// Remove tls entry
		ingress.body.spec.tls = ingress.body.spec.tls.filter(
			(tls) => !domainNames.includes(tls.hosts[0])
		);
		// If we do not have any tls entry left then delete ssl related annotations
		if (ingress.body.spec.tls.length === 0) {
			delete ingress.body.spec.tls;
			delete ingress.body.metadata.annotations[
				"nginx.ingress.kubernetes.io/ssl-redirect"
			];
			delete ingress.body.metadata.annotations[
				"nginx.ingress.kubernetes.io/force-ssl-redirect"
			];
			delete ingress.body.metadata.annotations[
				"cert-manager.io/cluster-issuer"
			];
		}

		// Update rules
		ingress.body.spec.rules = ingress.body.spec.rules.filter(
			(rule) => !domainNames.includes(rule.host)
		);

		const requestOptions = {
			headers: { "Content-Type": "application/merge-patch+json" },
		};
		await k8sNetworkingApi.replaceNamespacedIngress(
			`${containeriid}-cluster`,
			namespace,
			ingress.body,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			requestOptions
		);
	} catch (err) {
		logger.error(
			`Cannot remove custom domain(s) '${domainNames.join(
				", "
			)}' to ingress '${containeriid}-cluster'`,
			{
				details: err,
			}
		);
	}
}

/**
 * Updates the enforceSSLAccess settings for the specified ingress.
 */
export async function updateEnforceSSLAccessSettings(
	ingressName,
	namespace,
	enforceSSLAccess = false
) {
	try {
		const ingress = await getK8SResource("Ingress", ingressName, namespace);
		if (!ingress) return;

		if (enforceSSLAccess) {
			ingress.body.metadata.annotations[
				"nginx.ingress.kubernetes.io/ssl-redirect"
			] = "true";
			ingress.body.metadata.annotations[
				"nginx.ingress.kubernetes.io/force-ssl-redirect"
			] = "true";
		} else {
			ingress.body.metadata.annotations[
				"nginx.ingress.kubernetes.io/ssl-redirect"
			] = "false";
			ingress.body.metadata.annotations[
				"nginx.ingress.kubernetes.io/force-ssl-redirect"
			] = "false";
		}

		ingress.body.metadata.annotations["cert-manager.io/cluster-issuer"] =
			"letsencrypt-clusterissuer";
		ingress.body.metadata.annotations["kubernetes.io/ingress.class"] = "nginx";

		const requestOptions = {
			headers: { "Content-Type": "application/merge-patch+json" },
		};
		await k8sNetworkingApi.patchNamespacedIngress(
			ingressName,
			namespace,
			ingress.body,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			requestOptions
		);
	} catch (err) {
		logger.error(
			`Cannot update ssl access settings of ingress '${ingressName}'`,
			{ details: err }
		);
	}
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatKubernetesName(name) {
	return name
		.split(" ")
		.map((word, index) => {
			if (index === 0) {
				return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
			} else {
				return word.charAt(0).toUpperCase() + word.slice(1);
			}
		})
		.join("");
}

async function createGithubWebhook(
	gitPat,
	gitRepoUrl,
	webhookUrl,
	secretToken,
	sslVerification = false
) {
	const octokit = new Octokit({ auth: gitPat });
	const path = new URL(gitRepoUrl).pathname;

	var githubHook = await octokit.request("POST /repos" + path + "/hooks", {
		owner: path.split("/")[1],
		repo: path.split("/")[2],
		name: "web",
		active: true,
		events: ["push"],
		config: {
			url: webhookUrl,
			content_type: "json",
			secret: secretToken,
			insecure_ssl: sslVerification ? "0" : "1", // "1" disables SSL verification; "0" enables it.
		},
		headers: {
			"X-GitHub-Api-Version": "2022-11-28",
		},
	});

	console.log("GitHub repo webhook created");
	return githubHook.data.id;
}

async function deleteGithubWebhook(gitPat, gitRepoUrl, hookId) {
	if (!gitPat || !gitRepoUrl || !hookId) return;
	try {
		const octokit = new Octokit({ auth: gitPat });
		const path = new URL(gitRepoUrl).pathname;

		await octokit.request("DELETE /repos" + path + "/hooks/" + hookId, {
			owner: path.split("/")[1],
			repo: path.split("/")[2],
			hook_id: hookId,
			headers: {
				"X-GitHub-Api-Version": "2022-11-28",
			},
		});
		console.log("GitHub repo webhook deleted");
	} catch (err) {
		console.error("Error deleting GitLab repo webhook", err);
	}
}

async function createGitlabWebhook(
	gitPat,
	gitRepoUrl,
	webhookUrl,
	secretToken,
	gitBranch,
	sslVerification = false
) {
	const gitlabUrl = new URL(gitRepoUrl);
	const apiPath = "/api/v4";
	const projectName = gitlabUrl.pathname.split("/")[2];
	gitlabUrl.pathname = apiPath;
	const gitlabApiBaseUrl = gitlabUrl.toString();

	// Step 1: Get User ID
	const responseUser = await fetch(`${gitlabApiBaseUrl}/user`, {
		headers: { "PRIVATE-TOKEN": gitPat },
	});
	if (!responseUser.ok) {
		throw new AgnostError("Failed to fetch user data");
	}
	const user = await responseUser.json();
	const userId = user.id;

	// Step 2: Get All Project IDs Owned by User
	const responseProject = await fetch(
		`${gitlabApiBaseUrl}/users/${userId}/projects`,
		{
			headers: { "PRIVATE-TOKEN": gitPat },
		}
	);
	if (!responseProject.ok) {
		throw new AgnostError("Failed to fetch project data");
	}
	const projects = await responseProject.json();

	// Step 3: Find Specific Project ID
	const project = projects.find((project) => project.name === projectName);
	if (!project) {
		console.error(`Project '${projectName}' not found.`);
		return;
	}
	const projectId = project.id;

	// Step 4: Create Webhook
	const webhookPayload = {
		url: webhookUrl,
		push_events: true,
		issues_events: false,
		merge_requests_events: false,
		tag_push_events: false,
		repository_update_events: false,
		enable_ssl_verification: sslVerification,
		token: secretToken,
		push_events_branch_filter: gitBranch,
	};
	const response = await fetch(
		`${gitlabApiBaseUrl}/projects/${projectId}/hooks`,
		{
			method: "POST",
			headers: {
				"PRIVATE-TOKEN": gitPat,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(webhookPayload),
		}
	);
	if (!response.ok) {
		throw new AgnostError("Network response was not ok");
	}
	const webhook = await response.json();
	console.log("GitLab repo webhook created");

	return webhook.id;
}

async function deleteGitlabWebhook(gitPat, gitRepoUrl, hookId) {
	if (!gitPat || !gitRepoUrl || !hookId) return;
	try {
		const gitlabUrl = new URL(gitRepoUrl);
		const apiPath = "/api/v4";
		const projectName = gitlabUrl.pathname.split("/")[2];
		gitlabUrl.pathname = apiPath;
		const gitlabApiBaseUrl = gitlabUrl.toString();

		// Step 1: Get User ID
		const responseUser = await fetch(`${gitlabApiBaseUrl}/user`, {
			headers: { "PRIVATE-TOKEN": gitPat },
		});
		if (!responseUser.ok) {
			throw new AgnostError("Failed to fetch GitLab user data");
		}
		const user = await responseUser.json();
		const userId = user.id;

		// Step 2: Get All Project IDs Owned by User
		const responseProject = await fetch(
			`${gitlabApiBaseUrl}/users/${userId}/projects`,
			{
				headers: { "PRIVATE-TOKEN": gitPat },
			}
		);
		if (!responseProject.ok) {
			throw new AgnostError("Failed to fetch project data");
		}
		const projects = await responseProject.json();

		// Step 3: Find Specific Project ID
		const project = projects.find((project) => project.name === projectName);
		if (!project) {
			console.error(`Project '${projectName}' not found.`);
			return;
		}
		const projectId = project.id;

		// Step 4: Delete Webhook
		const response = await fetch(
			`${gitlabApiBaseUrl}/projects/${projectId}/hooks/${hookId}`,
			{
				method: "DELETE",
				headers: {
					"PRIVATE-TOKEN": gitPat,
					"Content-Type": "application/json",
				},
			}
		);
		if (!response.ok) {
			throw new AgnostError("Network response was not ok");
		}
		console.log("GitLab repo webhook deleted");
	} catch (err) {
		console.error("Error deleting GitLab repo webhook", err);
	}
}

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
		.catch((error) => ({
			step: stepName,
			status: status,
			logs: ["No log available"],
		}));
}
