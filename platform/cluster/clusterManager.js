import axios from "axios";
import k8s from "@kubernetes/client-node";
import {
	createRedis,
	deleteRedis,
	updateRedis,
	restartRedis,
} from "./redis.js";
import {
	createRabbitmqCluster,
	updateRabbitmqCluster,
	deleteRabbitmqCluster,
	restartRabbitMQ,
} from "./rabbitmq.js";
import {
	createMongoDBResource,
	updateMongoDBResource,
	deleteMongoDBResource,
	restartMongoDB,
} from "./mongodb.js";
import {
	createPostgresql,
	updatePostgresql,
	deletePostgresql,
	waitForSecret,
	restartPostgreSQL,
} from "./postgres.js";
import {
	createMySQLResource,
	updateMySQLResource,
	deleteMySQLResource,
	restartMySQL,
} from "./mysql.js";
import { updateMinioStorageSize } from "./minio.js";
import cntrCtrl from "../controllers/container.js";

export class ClusterManager {
	constructor(resourceObj) {
		// The resource object also include the action type and the callback url to send the logs
		this.resourceObj = resourceObj;

		// Resource management operation logs
		this.logs = [];

		this.conn = null; //MongoDB MongoClient connection
		this.platformDB = null; //MongoDB DB object reference
	}

	async getClusterIPs() {
		try {
			// Create a Kubernetes core API client
			const kubeconfig = new k8s.KubeConfig();
			kubeconfig.loadFromDefault();
			const k8sApi = kubeconfig.makeApiClient(k8s.NetworkingV1Api);

			const result = await k8sApi.readNamespacedIngress(
				"platform-ingress",
				process.env.NAMESPACE
			);
			const ingress = result.body;
			return ingress.status.loadBalancer.ingress.map(
				(ing) => ing.ip || ing.hostname
			);
		} catch (err) {
			logger.error(`Cannot fetch cluster ips`, { details: err });
			return [];
		}
	}

	/**
	 * Returns the resource action type, e,g., create, update, delete, bind
	 */
	getAction() {
		return this.resourceObj.action;
	}

	/**
	 * Returns the resource object
	 */
	getResourceName() {
		return this.resourceObj.name;
	}

	/**
	 * Returns the resource object
	 */
	getResource() {
		return this.resourceObj;
	}

	/**
	 * Returns the type of the resource
	 */
	getResourceType() {
		return this.resourceObj.type;
	}

	/**
	 * Returns the instance of the resource
	 */
	getResourceInstance() {
		return this.resourceObj.instance;
	}

	/**
	 * Returns true if the resource is managed by the Agnost cluster, false otherwise
	 */
	isManaged() {
		return this.resourceObj.managed;
	}

	/**
	 * Adds a log message to track the progress of resource management operation
	 * @param  {string} message Logged message
	 * @param  {string} status Whether the operation has completed successfully or with errors
	 */
	addLog(message, status = "OK") {
		this.logs.push({
			startedAt: new Date(),
			status,
			message,
		});

		logger.info(message);
	}

	/**
	 * Updates the resource status and logs in platform
	 * @param  {string} status Final environment status
	 */
	async sendResourceLogs(status = "OK") {
		// If there is no callback just return
		if (!this.resourceObj.callback) return;
		try {
			// Update the resource log object
			await axios.post(
				this.resourceObj.callback,
				{
					status,
					logs: this.logs,
				},
				{
					headers: {
						Authorization: process.env.MASTER_TOKEN,
						"Content-Type": "application/json",
					},
				}
			);
		} catch (err) {}
	}

	/**
	 * Creates the resource in Agnost cluster
	 */
	async creteResource() {
		try {
			this.addLog(t("Started resource creation"));
			switch (this.getResourceType()) {
				case "engine":
					await this.createAPIServer();
					break;
				case "cache":
					if (this.getResourceInstance() === "Redis")
						await this.createRedisCache();
					break;
				case "queue":
					if (this.getResourceInstance() === "RabbitMQ")
						await this.createRabbitMQMessageBroker();
					break;
				case "database":
					if (this.getResourceInstance() === "MongoDB")
						await this.createMongoDBReplicaSet();
					else if (this.getResourceInstance() === "PostgreSQL")
						await this.createPostgreSQLCluster();
					else if (this.getResourceInstance() === "MySQL")
						await this.createMySQLCluster();
					break;
				default:
					break;
			}
			this.addLog(t("Completed resource creation successfully"));
			// Send the resource telemetry information to the platform
			await this.sendResourceLogs("OK");
			return { success: true };
		} catch (error) {
			// Send the deployment telemetry information to the platform
			this.addLog(
				[
					t("Resource creation failed"),
					error.name,
					error.message,
					error.stack,
				].join("\n"),
				"Error"
			);
			await this.sendResourceLogs("Error");
			return { success: false, error };
		}
	}

	/**
	 * Binds the resource to an existing cluster asset (e.g., messageq queue, cron job scheduler)
	 */
	async bindResource() {
		try {
			this.addLog(t("Started resource binding"));
			this.addLog(t("Completed resource binding successfully"));
			// Send the resource telemetry information to the platform
			await this.sendResourceLogs("OK");
			return { success: true };
		} catch (error) {
			// Send the deployment telemetry information to the platform
			this.addLog(
				[
					t("Resource binding failed"),
					error.name,
					error.message,
					error.stack,
				].join("\n"),
				"Error"
			);
			await this.sendResourceLogs("Error");
			return { success: false, error };
		}
	}

	/**
	 * Updates the configuration of managed resource
	 */
	async updateResource() {
		try {
			this.addLog(t("Started resource update"));
			const resource = this.getResource();
			switch (this.getResourceType()) {
				case "engine":
					await this.updateAPIServer();
					break;
				case "cache":
					if (this.getResourceInstance() === "Redis")
						await updateRedis(
							this.getResourceName(),
							resource.config.version,
							resource.config.size,
							resource.config.readReplica
						);
					break;
				case "queue":
					if (this.getResourceInstance() === "RabbitMQ")
						await updateRabbitmqCluster(
							this.getResourceName(),
							resource.config.version,
							resource.config.size,
							resource.config.replicas
						);
					break;
				case "database":
					if (this.getResourceInstance() === "MongoDB") {
						await updateMongoDBResource(
							this.getResourceName(),
							resource.config.version,
							resource.config.size,
							resource.config.replicas
						);
					} else if (this.getResourceInstance() === "PostgreSQL") {
						await updatePostgresql(
							this.getResourceName(),
							resource.config.version,
							resource.config.size,
							resource.config.instances
						);

						// We have deleted the read-only replicas
						if (
							resource.config.instances === 1 &&
							resource.accessReadOnly.length === 1
						) {
							this.updateResourceReadOnlyAccessSettings([]);
						}
						// We have added the read-only replicas
						else if (
							resource.config.instances > 1 &&
							resource.accessReadOnly.length === 0
						) {
							this.updateResourceReadOnlyAccessSettings([
								{
									host: `${resource.name}-repl.${process.env.NAMESPACE}.svc.cluster.local`,
									port: 5432,
									username: "postgres",
									password: resource.access.password,
								},
							]);
						}
					} else if (this.getResourceInstance() === "MySQL") {
						await updateMySQLResource(
							this.getResourceName(),
							resource.config.version,
							resource.config.instances,
							resource.config.size
						);

						// We have deleted the read-only replicas
						if (
							resource.config.instances === 1 &&
							resource.accessReadOnly.length === 1
						) {
							this.updateResourceReadOnlyAccessSettings([]);
						}
						// We have added the read-only replicas
						else if (
							resource.config.instances > 1 &&
							resource.accessReadOnly.length === 0
						) {
							this.updateResourceReadOnlyAccessSettings([
								{
									host: `${resource.name}.${process.env.NAMESPACE}.svc.cluster.local`,
									port: 6447, // Readonly port
									username: resource.access.username,
									password: resource.access.password,
								},
							]);
						}
					}
					break;
				default:
					break;
			}
			this.addLog(t("Completed resource update successfully"));
			// Send the resource telemetry information to the platform
			await this.sendResourceLogs("OK");
			return { success: true };
		} catch (error) {
			// Send the deployment telemetry information to the platform
			this.addLog(
				[
					t("Resource update failed"),
					error.name,
					error.message,
					error.stack,
				].join("\n"),
				"Error"
			);
			await this.sendResourceLogs("Error");
			return { success: false, error };
		}
	}

	/**
	 * Restarts the managed resource
	 */
	async restartManagedResource() {
		try {
			this.addLog(t("Restarting managed resource"));
			switch (this.getResourceType()) {
				case "cache":
					if (this.getResourceInstance() === "Redis")
						await restartRedis(this.getResourceName());
					break;
				case "queue":
					if (this.getResourceInstance() === "RabbitMQ")
						await restartRabbitMQ(this.getResourceName());
					break;
				case "database":
					if (this.getResourceInstance() === "MongoDB") {
						await restartMongoDB(this.getResourceName());
					} else if (this.getResourceInstance() === "PostgreSQL") {
						await restartPostgreSQL(this.getResourceName());
					} else if (this.getResourceInstance() === "MySQL") {
						await restartMySQL(this.getResourceName());
					}
					break;
				default:
					break;
			}
			this.addLog(t("Completed resource restart successfully"));
			// Send the resource telemetry information to the platform
			await this.sendResourceLogs("OK");
			return { success: true };
		} catch (error) {
			// Send the deployment telemetry information to the platform
			this.addLog(
				[
					t("Resource restart failed"),
					error.name,
					error.message,
					error.stack,
				].join("\n"),
				"Error"
			);
			await this.sendResourceLogs("Error");
			return { success: false, error };
		}
	}

	/**
	 * Enables/disables the TCP proxy of the resource service
	 */
	async manageTCPProxy() {
		try {
			this.addLog(t("Updating TCP proxy of managed resource"));
			const resource = this.getResource();
			const serviceName = resource.access.host.split(".")[0];
			if (resource.tcpProxyEnabled) {
				// Enable TCP proxy of the resource
				await this.exposeService(
					serviceName,
					resource.tcpProxyPort,
					resource.access.port
				);
			} else {
				// Disable TCP proxy of the resource
				await this.unexposeService(resource.tcpProxyPort);
			}

			this.addLog(t("Completed resource TCP proxy update successfully"));
			// Send the resource telemetry information to the platform
			await this.sendResourceLogs("OK");
			return { success: true };
		} catch (error) {
			// Send the deployment telemetry information to the platform
			this.addLog(
				[
					t("Resource TCP proxy update failed"),
					error.name,
					error.message,
					error.stack,
				].join("\n"),
				"Error"
			);
			await this.sendResourceLogs("Error");
			return { success: false, error };
		}
	}

	/**
	 * Deletes the managed resource
	 */
	async deleteResource() {
		try {
			this.addLog(t("Started resource deletion"));
			const resource = this.getResource();
			switch (this.getResourceType()) {
				case "engine":
					await this.deleteAPIServer();
					break;
				case "cache":
					if (this.getResourceInstance() === "Redis")
						await deleteRedis(this.getResourceName());
					break;
				case "queue":
					if (this.getResourceInstance() === "RabbitMQ") {
						const access = helper.decryptSensitiveData(resource.access);
						await deleteRabbitmqCluster(
							this.getResourceName(),
							access.username
						);
					}
					break;
				case "database":
					if (this.getResourceInstance() === "MongoDB") {
						await deleteMongoDBResource(this.getResourceName());
					} else if (this.getResourceInstance() === "PostgreSQL") {
						await deletePostgresql(this.getResourceName());
					} else if (this.getResourceInstance() === "MySQL") {
						await deleteMySQLResource(this.getResourceName());
					}
					break;
				default:
					break;
			}

			// If the TCP proxy is enabled then unexpose the service
			if (resource.tcpProxyEnabled && resource.tcpProxyPort) {
				await this.unexposeService(resource.tcpProxyPort);
			}

			this.addLog(t("Completed resource deletion successfully"));
			// Send the resource telemetry information to the platform
			await this.sendResourceLogs("OK");
			return { success: true };
		} catch (error) {
			// Send the deployment telemetry information to the platform
			this.addLog(
				[
					t("Resource deletion failed"),
					error.name,
					error.message,
					error.stack,
				].join("\n"),
				"Error"
			);
			await this.sendResourceLogs("Error");
			return { success: false, error };
		}
	}

	/**
	 * Creates an engine deployment (API server) and associated horizontal pod autoscaler and ingress entry
	 */
	async createAPIServer() {
		const resource = this.getResource();

		// Create the deployment of engine
		await this.createKnativeService(
			resource.iid,
			resource.access,
			resource.config
		);

		// Add the Ingress for the engine service
		await this.createIngress(
			resource.iid,
			resource.iid,
			resource.iid,
			config.get("general.defaultKnativeIngressPort")
		);

		// Create container ingress for custom domains
		await this.createContainerIngress(
			resource.iid,
			resource.iid,
			resource.iid,
			config.get("general.defaultKnativeIngressPort")
		);
	}

	/**
	 * Updates deployment resources, basically updates deployment resource requests, limits, replica count and HPA configuration.
	 * No changes are made for the deployment servcie and the ingress rule
	 */
	async updateAPIServer() {
		const resource = this.getResource();

		// Update the deployment of engine
		await this.updateKnativeService(resource.iid, resource.config);
	}

	/**
	 * Deletes deployment resources, deletes the deployment and accosiated HPA and clusterIP service and removes ingress rule
	 */
	async deleteAPIServer() {
		const resource = this.getResource();

		// Delete the deployment of engine
		await this.deleteKnativeService(resource.iid);

		// Delete the Ingress of the engine service
		await this.deleteIngress(resource.iid);
		// Delete the Ingress of the engine service
		await this.deleteContainerIngress(resource.iid);
	}

	/**
	 * Restarts the API server
	 */
	async restartAPIServer() {
		const resource = this.getResource();

		// Create a Kubernetes core API client
		const kubeconfig = new k8s.KubeConfig();
		kubeconfig.loadFromDefault();
		const k8sApi = kubeconfig.makeApiClient(k8s.CustomObjectsApi);

		try {
			const existingService = await k8sApi.getNamespacedCustomObjectStatus(
				"serving.knative.dev",
				"v1",
				process.env.NAMESPACE,
				"services",
				resource.iid
			);

			// Modify the deployment (e.g., update an environment variable)
			// This is an example; modify according to your deployment spec
			const container = existingService.body.spec.template.spec.containers[0];
			container.env.push({
				name: "RESTART_TIMESTAMP",
				value: new Date().toISOString(),
			});

			container.livenessProbe = {
				httpGet: {
					path: "/agnost/health",
					port: config.get("general.defaultClusterIPPort"),
				},
				timeoutSeconds: config.get("general.livenessProbe.timeoutSeconds"),
				periodSeconds: config.get("general.livenessProbe.periodSeconds"),
				initialDelaySeconds: config.get(
					"general.livenessProbe.initialDelaySeconds"
				),
			};

			container.readinessProbe = {
				httpGet: {
					path: "/agnost/health",
					port: config.get("general.defaultClusterIPPort"),
				},
				timeoutSeconds: config.get("general.readinessProbe.timeoutSeconds"),
				periodSeconds: config.get("general.readinessProbe.periodSeconds"),
				initialDelaySeconds: config.get(
					"general.readinessProbe.initialDelaySeconds"
				),
				failureThreshold: config.get("general.readinessProbe.failureThreshold"),
			};

			// Apply updated Knative Service
			await k8sApi.replaceNamespacedCustomObject(
				"serving.knative.dev",
				"v1",
				process.env.NAMESPACE,
				"services",
				resource.iid,
				existingService.body
			);
			return { success: true };
		} catch (err) {
			return { success: false, err };
		}
	}

	/**
	 * Creates an engine deployment (API server)
	 * @param  {string} deploymentName The deployment name prefix (resource iid)
	 * @param  {object} accessConfig The access configuration of the deployment
	 * @param  {object} deploymentConfig The deployment configuration
	 */
	async createKnativeService(deploymentName, accessConfig, deploymentConfig) {
		// Create a Kubernetes core API client
		const kubeconfig = new k8s.KubeConfig();
		kubeconfig.loadFromDefault();
		const k8sApi = kubeconfig.makeApiClient(k8s.CustomObjectsApi);
		const apiServerVersion = await this.getAPIServerVersion();

		// Define the Deployment specification
		const serviceSpec = {
			apiVersion: "serving.knative.dev/v1",
			kind: "Service",
			metadata: {
				name: deploymentName,
			},
			spec: {
				template: {
					metadata: {
						labels: {
							app: deploymentName,
						},
						annotations: {
							"autoscaling.knative.dev/initial-scale":
								deploymentConfig.initialScale.toString(),
							"autoscaling.knative.dev/target":
								deploymentConfig.target.toString(),
							"autoscaling.knative.dev/metric": "concurrency",
							"autoscaling.knative.dev/max-scale":
								deploymentConfig.maxScale.toString(),
							"autoscaling.knative.dev/min-scale":
								deploymentConfig.minScale.toString(),
							"autoscaling.knative.dev/target-utilization-percentage": "80",
							"autoscaling.knative.dev/scale-down-delay":
								deploymentConfig.scaleDownDelay.toString(),
							"autoscaling.knative.dev/scale-to-zero-pod-retention-period":
								deploymentConfig.scaleToZeroPodRetentionPeriod.toString(),
						},
					},
					spec: {
						containerConcurrency: deploymentConfig.containerConcurrency,
						containers: [
							{
								image: apiServerVersion
									? `gcr.io/agnost-community/engine/core:${apiServerVersion}`
									: "gcr.io/agnost-community/engine/core",
								ports: [
									{
										containerPort: config.get("general.defaultClusterIPPort"),
									},
								],
								env: [
									{
										name: "AGNOST_VERSION_ID",
										value: accessConfig.versionId,
									},
									{
										name: "AGNOST_ENVIRONMENT_ID",
										value: accessConfig.envId,
									},
									{
										name: "CACHE_HOSTNAME",
										value: process.env.CACHE_HOSTNAME,
									},
									{
										name: "CACHE_READ_REPLICA_HOSTNAME",
										value: process.env.CACHE_READ_REPLICA_HOSTNAME,
									},
									{
										name: "CACHE_PWD",
										value: process.env.CACHE_PWD,
									},
									{
										name: "CACHE_READ_REPLICA_PWD",
										value: process.env.CACHE_READ_REPLICA_PWD,
									},
									{
										name: "QUEUE_USERNAME",
										value: process.env.QUEUE_USERNAME,
									},
									{
										name: "QUEUE_PASSWORD",
										value: process.env.QUEUE_PASSWORD,
									},
									{
										name: "QUEUE_HOST",
										value: process.env.QUEUE_HOST,
									},
									{
										name: "CLUSTER_DB_URI",
										value: process.env.CLUSTER_DB_URI,
									},
									{
										name: "CLUSTER_DB_USER",
										value: process.env.CLUSTER_DB_USER,
									},
									{
										name: "CLUSTER_DB_PWD",
										value: process.env.CLUSTER_DB_PWD,
									},
									{
										name: "MASTER_TOKEN",
										value: process.env.MASTER_TOKEN,
									},
									{
										name: "ACCESS_TOKEN",
										value: process.env.ACCESS_TOKEN,
									},
									{
										name: "PASSPHRASE",
										value: process.env.PASSPHRASE,
									},
									{
										name: "POD_NAME",
										value: "api-server",
									},
									{
										name: "NAMESPACE",
										value: process.env.NAMESPACE,
									},
									{
										name: "JWT_SECRET",
										value: process.env.JWT_SECRET,
									},
									{
										name: "RELEASE_NUMBER",
										value: process.env.RELEASE_NUMBER,
									},
								],
								resources: {
									requests: {
										cpu: deploymentConfig.cpu.request.toString(),
										memory: deploymentConfig.memory.request.toString(),
									},
									limits: {
										cpu: deploymentConfig.cpu.limit.toString(),
										memory: deploymentConfig.memory.limit.toString(),
									},
								},
								livenessProbe: {
									httpGet: {
										path: "/agnost/health",
										port: config.get("general.defaultClusterIPPort"),
									},
									timeoutSeconds: config.get(
										"general.livenessProbe.timeoutSeconds"
									),
									periodSeconds: config.get(
										"general.livenessProbe.periodSeconds"
									),
									initialDelaySeconds: config.get(
										"general.livenessProbe.initialDelaySeconds"
									),
								},
								readinessProbe: {
									httpGet: {
										path: "/agnost/health",
										port: config.get("general.defaultClusterIPPort"),
									},
									timeoutSeconds: config.get(
										"general.readinessProbe.timeoutSeconds"
									),
									periodSeconds: config.get(
										"general.readinessProbe.periodSeconds"
									),
									initialDelaySeconds: config.get(
										"general.readinessProbe.initialDelaySeconds"
									),
									failureThreshold: config.get(
										"general.readinessProbe.failureThreshold"
									),
								},
							},
						],
					},
				},
			},
		};

		try {
			// Create the knative service
			await k8sApi.createNamespacedCustomObject(
				"serving.knative.dev",
				"v1",
				process.env.NAMESPACE,
				"services",
				serviceSpec
			);
		} catch (err) {
			throw new AgnostError(err.body?.message);
		}
	}

	/**
	 * Updates an engine deployment (API server) min, max replicas and scale down parameters
	 * @param  {string} deploymentName The deployment name prefix (resource iid)
	 * @param  {object} deploymentConfig The deployment configuration
	 */
	async updateKnativeService(deploymentName, deploymentConfig) {
		// Create a Kubernetes core API client
		const kubeconfig = new k8s.KubeConfig();
		kubeconfig.loadFromDefault();
		const k8sApi = kubeconfig.makeApiClient(k8s.CustomObjectsApi);

		try {
			const existingService = await k8sApi.getNamespacedCustomObjectStatus(
				"serving.knative.dev",
				"v1",
				process.env.NAMESPACE,
				"services",
				deploymentName
			);

			// Update annotations
			existingService.body.spec.template.metadata.annotations = {
				...existingService.body.spec.template.metadata.annotations,
				"autoscaling.knative.dev/target":
					deploymentConfig.target?.toString() ??
					existingService.body.spec.template.metadata.annotations[
						"autoscaling.knative.dev/target"
					],
				"autoscaling.knative.dev/max-scale":
					deploymentConfig.maxScale.toString(),
				"autoscaling.knative.dev/min-scale":
					deploymentConfig.minScale.toString(),
				"autoscaling.knative.dev/scale-down-delay":
					deploymentConfig.scaleDownDelay.toString(),
				"autoscaling.knative.dev/scale-to-zero-pod-retention-period":
					deploymentConfig.scaleToZeroPodRetentionPeriod.toString(),
			};

			existingService.body.spec.template.spec.containerConcurrency =
				deploymentConfig.containerConcurrency;
			const container = existingService.body.spec.template.spec.containers[0];
			container.resources = {
				requests: {
					cpu: deploymentConfig.cpu.request.toString(),
					memory: deploymentConfig.memory.request.toString(),
				},
				limits: {
					cpu: deploymentConfig.cpu.limit.toString(),
					memory: deploymentConfig.memory.limit.toString(),
				},
			};

			container.livenessProbe = {
				httpGet: {
					path: "/agnost/health",
					port: config.get("general.defaultClusterIPPort"),
				},
				timeoutSeconds: config.get("general.livenessProbe.timeoutSeconds"),
				periodSeconds: config.get("general.livenessProbe.periodSeconds"),
				initialDelaySeconds: config.get(
					"general.livenessProbe.initialDelaySeconds"
				),
			};

			container.readinessProbe = {
				httpGet: {
					path: "/agnost/health",
					port: config.get("general.defaultClusterIPPort"),
				},
				timeoutSeconds: config.get("general.readinessProbe.timeoutSeconds"),
				periodSeconds: config.get("general.readinessProbe.periodSeconds"),
				initialDelaySeconds: config.get(
					"general.readinessProbe.initialDelaySeconds"
				),
				failureThreshold: config.get("general.readinessProbe.failureThreshold"),
			};

			// Apply updated Knative Service
			await k8sApi.replaceNamespacedCustomObject(
				"serving.knative.dev",
				"v1",
				process.env.NAMESPACE,
				"services",
				deploymentName,
				existingService.body
			);
		} catch (err) {
			throw new AgnostError(err.body?.message);
		}
	}

	/**
	 * Updates an engine deployment (API server) image - changes the version of the api server image
	 * @param  {string} deploymentName The deployment name prefix (resource iid)
	 * @param  {string} imageName The new image name
	 */
	async updateKnativeServiceImage(deploymentName, imageName) {
		// Create a Kubernetes core API client
		const kubeconfig = new k8s.KubeConfig();
		kubeconfig.loadFromDefault();
		const k8sApi = kubeconfig.makeApiClient(k8s.CustomObjectsApi);

		try {
			const existingService = await k8sApi.getNamespacedCustomObjectStatus(
				"serving.knative.dev",
				"v1",
				process.env.NAMESPACE,
				"services",
				deploymentName
			);

			// Update image and environment variable
			const container = existingService.body.spec.template.spec.containers[0];
			container.image = imageName;

			let releaseUpdated = false;
			container.env = container.env.map((entry) => {
				if (entry.name === "RELEASE_NUMBER") {
					releaseUpdated = true;
					return { ...entry, value: imageName.split(":")[1] };
				} else return entry;
			});

			if (!releaseUpdated)
				container.env.push({
					name: "RELEASE_NUMBER",
					value: imageName.split(":")[1],
				});

			container.livenessProbe = {
				httpGet: {
					path: "/agnost/health",
					port: config.get("general.defaultClusterIPPort"),
				},
				timeoutSeconds: config.get("general.livenessProbe.timeoutSeconds"),
				periodSeconds: config.get("general.livenessProbe.periodSeconds"),
				initialDelaySeconds: config.get(
					"general.livenessProbe.initialDelaySeconds"
				),
			};

			container.readinessProbe = {
				httpGet: {
					path: "/agnost/health",
					port: config.get("general.defaultClusterIPPort"),
				},
				timeoutSeconds: config.get("general.readinessProbe.timeoutSeconds"),
				periodSeconds: config.get("general.readinessProbe.periodSeconds"),
				initialDelaySeconds: config.get(
					"general.readinessProbe.initialDelaySeconds"
				),
			};

			// Apply updated Knative Service
			await k8sApi.replaceNamespacedCustomObject(
				"serving.knative.dev",
				"v1",
				process.env.NAMESPACE,
				"services",
				deploymentName,
				existingService.body
			);
		} catch (err) {
			logger.error(`Cannot update API server '${deploymentName}' version`, {
				details: err,
			});
		}
	}

	/**
	 * Deletes an engine Knative service (API server)
	 * @param  {string} deploymentName The deployment name prefix (resource iid)
	 */
	async deleteKnativeService(deploymentName) {
		// Create a Kubernetes core API client
		const kubeconfig = new k8s.KubeConfig();
		kubeconfig.loadFromDefault();
		const k8sApi = kubeconfig.makeApiClient(k8s.CustomObjectsApi);

		try {
			// Delete the deployment
			await k8sApi.deleteNamespacedCustomObject(
				"serving.knative.dev",
				"v1",
				process.env.NAMESPACE,
				"services",
				deploymentName
			);
		} catch (err) {
			throw new AgnostError(err.body?.message);
		}
	}

	/**
	 * Creates the ingress rule for the API server
	 * @param  {string} ingressName The ingress name
	 * @param  {string} pathName The ingress path to route external traffic to the resource (resource iid)
	 * @param  {string} serviceName The service name prefix (resource iid)
	 * @param  {number} port The service port
	 */
	async createIngress(ingressName, pathName, serviceName, port) {
		// Create a Kubernetes core API client
		const kubeconfig = new k8s.KubeConfig();
		kubeconfig.loadFromDefault();
		const networkingApi = kubeconfig.makeApiClient(k8s.NetworkingV1Api);

		// Get cluster info from the database
		const cluster = await this.getClusterRecord();

		try {
			const ingress = {
				apiVersion: "networking.k8s.io/v1",
				kind: "Ingress",
				metadata: {
					name: `${ingressName}-ingress`,
					annotations: {
						"nginx.ingress.kubernetes.io/proxy-body-size": "500m",
						"nginx.ingress.kubernetes.io/proxy-connect-timeout": "6000",
						"nginx.ingress.kubernetes.io/proxy-send-timeout": "6000",
						"nginx.ingress.kubernetes.io/proxy-read-timeout": "6000",
						"nginx.ingress.kubernetes.io/proxy-next-upstream-timeout": "6000",
						"nginx.ingress.kubernetes.io/rewrite-target": "/$2",
						// "nginx.ingress.kubernetes.io/configuration-snippet": "proxy_set_header X-Original-Host $host;",
						"nginx.ingress.kubernetes.io/upstream-vhost": `${ingressName}.${process.env.NAMESPACE}.svc.cluster.local`,
					},
				},
				spec: {
					ingressClassName: "nginx",
					rules: [
						{
							http: {
								paths: [
									{
										path: `/${pathName}(/|$)(.*)`,
										pathType: "Prefix",
										backend: {
											service: {
												name: `${serviceName}`,
												port: { number: port },
											},
										},
									},
								],
							},
						},
					],
				},
			};

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
					await this.initializeCertificateIssuer();
					const secrets = await this.getClusterDomainSecrets();
					ingress.metadata.annotations["cert-manager.io/issuer"] =
						"letsencrypt-issuer-cluster";

					ingress.spec.tls = cluster.domains.map((domainName) => {
						const tlsEntry = secrets.find(
							(entry) => entry.domainName === domainName
						);
						const secretName = tlsEntry
							? tlsEntry.secretName
							: helper.getCertSecretName();

						return {
							hosts: [domainName],
							secretName: secretName,
						};
					});

					for (const domainName of cluster.domains) {
						ingress.spec.rules.push({
							host: domainName,
							http: {
								paths: [
									{
										path: `/${pathName}(/|$)(.*)`,
										pathType: "Prefix",
										backend: {
											service: {
												name: `${serviceName}`,
												port: { number: port },
											},
										},
									},
								],
							},
						});
					}
				}
			}

			// Create the ingress with the provided spec
			await networkingApi.createNamespacedIngress(
				process.env.NAMESPACE,
				ingress
			);
		} catch (err) {
			throw new AgnostError(err.body?.message);
		}
	}

	/**
	 * Creates a container ingress in Kubernetes. This ingress is mainly used to handle custom domain based ingresses.
	 * @param  {string} ingressName The ingress name
	 * @param  {string} pathName The ingress path to route external traffic to the resource (resource iid)
	 * @param  {string} serviceName The service name prefix (resource iid)
	 * @param  {number} port The service port
	 */
	async createContainerIngress(ingressName, pathName, serviceName, port) {
		// Create a Kubernetes core API client
		const kubeconfig = new k8s.KubeConfig();
		kubeconfig.loadFromDefault();
		const networkingApi = kubeconfig.makeApiClient(k8s.NetworkingV1Api);

		// Get cluster info from the database
		const cluster = await this.getClusterRecord();

		try {
			const ingress = {
				apiVersion: "networking.k8s.io/v1",
				kind: "Ingress",
				metadata: {
					name: `${ingressName}-container-ingress`,
					annotations: {
						"nginx.ingress.kubernetes.io/proxy-body-size": "500m",
						"nginx.ingress.kubernetes.io/proxy-connect-timeout": "6000",
						"nginx.ingress.kubernetes.io/proxy-send-timeout": "6000",
						"nginx.ingress.kubernetes.io/proxy-read-timeout": "6000",
						"nginx.ingress.kubernetes.io/proxy-next-upstream-timeout": "6000",
						// "nginx.ingress.kubernetes.io/configuration-snippet": "proxy_set_header X-Original-Host $host;",
						"nginx.ingress.kubernetes.io/upstream-vhost": `${ingressName}.${process.env.NAMESPACE}.svc.cluster.local`,
					},
				},
				spec: {
					ingressClassName: "nginx",
					rules: [
						{
							http: {
								paths: [
									{
										path: `/${pathName}-temp(/|$)(.*)`,
										pathType: "Prefix",
										backend: {
											service: {
												name: `${serviceName}`,
												port: { number: port },
											},
										},
									},
								],
							},
						},
					],
				},
			};

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
			}

			// Create the ingress with the provided spec
			await networkingApi.createNamespacedIngress(
				process.env.NAMESPACE,
				ingress
			);
		} catch (err) {
			throw new AgnostError(err.body?.message);
		}
	}

	/**
	 * Deletes the ingress of the API server
	 * @param  {string} ingressName The ingress name
	 */
	async deleteIngress(ingressName) {
		// Create a Kubernetes core API client
		const kubeconfig = new k8s.KubeConfig();
		kubeconfig.loadFromDefault();
		const networkingApi = kubeconfig.makeApiClient(k8s.NetworkingV1Api);

		try {
			// Delete the ingress resource
			await networkingApi.deleteNamespacedIngress(
				`${ingressName}-ingress`,
				process.env.NAMESPACE
			);
		} catch (err) {
			throw new AgnostError(err.body?.message);
		}
	}

	/**
	 * Deletes the ingress of the API server, this ingress is mainly used to handle custom domain based ingresses
	 * @param  {string} ingressName The ingress name
	 */
	async deleteContainerIngress(ingressName) {
		// Create a Kubernetes core API client
		const kubeconfig = new k8s.KubeConfig();
		kubeconfig.loadFromDefault();
		const networkingApi = kubeconfig.makeApiClient(k8s.NetworkingV1Api);

		try {
			// Delete the ingress resource
			await networkingApi.deleteNamespacedIngress(
				`${ingressName}-container-ingress`,
				process.env.NAMESPACE
			);
		} catch (err) {
			throw new AgnostError(err.body?.message);
		}
	}

	/**
	 * Returns information about the Agnost cluster default deployments and horizontal pod autoscalers
	 */
	async getClusterInfo() {
		const clusterInfo = [];
		const clusterComponents = (await import("./clusterComponents.js"))
			.clusterComponents;
		// Create a Kubernetes core API client
		const kubeconfig = new k8s.KubeConfig();
		kubeconfig.loadFromDefault();
		const k8sApi = kubeconfig.makeApiClient(k8s.AppsV1Api);
		const k8sAutoscalingApi = kubeconfig.makeApiClient(k8s.AutoscalingV1Api);
		const k8sCoreApi = kubeconfig.makeApiClient(k8s.CoreV1Api);

		try {
			let deployments = await k8sApi.listNamespacedDeployment(
				process.env.NAMESPACE
			);
			let statefulSets = await k8sApi.listNamespacedStatefulSet(
				process.env.NAMESPACE
			);
			let hpas = await k8sAutoscalingApi.listNamespacedHorizontalPodAutoscaler(
				process.env.NAMESPACE
			);
			const pvcs = await k8sCoreApi.listNamespacedPersistentVolumeClaim(
				process.env.NAMESPACE
			);

			for (const comp of clusterComponents) {
				if (comp.k8sType === "Deployment") {
					const info = this.getDeploymentInfo(
						comp,
						deployments.body.items,
						hpas.body.items,
						pvcs.body.items
					);
					if (info) clusterInfo.push(info);
				} else if (comp.k8sType === "StatefulSet") {
					const info = this.getStatefulSetInfo(
						comp,
						statefulSets.body.items,
						pvcs.body.items
					);
					if (info) {
						clusterInfo.push(info);
					}
				}
			}

			return clusterInfo;
		} catch (err) {
			throw new AgnostError(err.body?.message);
		}
	}

	/**
	 * Returns information about the Agnost cluster default deployments and horizontal pod autoscalers
	 */
	getDeploymentInfo(component, deployments, hpas, pvcs) {
		const deployment = deployments.find(
			(entry) => entry.metadata.name === component.deploymentName
		);
		if (!deployment) return null;
		const hpa = component.hasHpa
			? hpas.find((entry) => entry.metadata.name === component.hpaName)
			: null;
		let container = deployment.spec.template.spec.containers[0];

		const info = {
			version: container.image.split(":")[1],
			configuredReplicas: deployment.spec.replicas,
			runningReplicas: deployment.status.availableReplicas,
			resources: container.resources,
		};

		if (hpa) {
			info.minReplicas = hpa.spec.minReplicas;
			info.maxReplicas = hpa.spec.maxReplicas;
			info.hpaCurrentReplicas = hpa.status.currentReplicas;
		}

		if (component.hasPVC) {
			const pvc = pvcs.find(
				(entry) => entry.metadata.name === component.PVCName
			);
			if (pvc) {
				info.pvcSize = pvc.spec.resources.requests.storage;
			}
		}

		const comp = { ...component, info };
		return comp;
	}

	/**
	 * Returns information about the Agnost cluster default stateful sets
	 */
	getStatefulSetInfo(component, statefulSets, pvcs) {
		const statefulSet = statefulSets.find(
			(entry) => entry.metadata.name === component.statefulSetName
		);
		if (!statefulSet) return null;
		let container = statefulSet.spec.template.spec.containers[0];

		const info = {
			version: container.image.split(":")[1],
			configuredReplicas: statefulSet.spec.replicas,
			runningReplicas: statefulSet.status.availableReplicas,
			resources: container.resources,
		};

		if (component.hasPVC) {
			const pvc = pvcs.find(
				(entry) => entry.metadata.name === component.PVCName
			);
			if (pvc) {
				info.pvcSize = pvc.spec.resources.requests.storage;
			}
		}

		const comp = { ...component, info };
		return comp;
	}

	/**
	 * Updates the cluster component - deployment
	 * @param  {string} component The component name
	 * @param  {number} replicas The initial replicas of the component
	 * @param  {string} imageName The new docker image name and version
	 */
	async updateDeployment(deploymentName, replicas = null, imageName = null) {
		// Create a Kubernetes core API client
		const kubeconfig = new k8s.KubeConfig();
		kubeconfig.loadFromDefault();
		const k8sApi = kubeconfig.makeApiClient(k8s.AppsV1Api);

		try {
			const response = await k8sApi.readNamespacedDeployment(
				deploymentName,
				process.env.NAMESPACE
			);

			if (replicas) response.body.spec.replicas = replicas;
			if (imageName) {
				let container = response.body.spec.template.spec.containers[0];
				container.imagePullPolicy = "IfNotPresent";
				container.image = imageName;

				let releaseUpdated = false;
				container.env = container.env.map((entry) => {
					if (entry.name === "RELEASE_NUMBER") {
						releaseUpdated = true;
						return { ...entry, value: imageName.split(":")[1] };
					} else return entry;
				});

				if (!releaseUpdated)
					container.env.push({
						name: "RELEASE_NUMBER",
						value: imageName.split(":")[1],
					});
			}

			// Update the deployment
			await k8sApi.replaceNamespacedDeployment(
				deploymentName,
				process.env.NAMESPACE,
				response.body
			);
		} catch (err) {
			logger.error(`Cannot update deployment '${deploymentName}'`, {
				details: err,
			});
		}
	}

	/**
	 * Updates the cluster component - hpa
	 * @param  {string} component The component name
	 * @param  {number} minReplicas The min replicas
	 * @param  {number} maxReplicas The max replicas
	 */
	async updateHPA(hpaName, minReplicas, maxReplicas) {
		// Create a Kubernetes core API client
		const kubeconfig = new k8s.KubeConfig();
		kubeconfig.loadFromDefault();
		const k8sApi = kubeconfig.makeApiClient(k8s.AutoscalingV2Api);

		try {
			const response = await k8sApi.readNamespacedHorizontalPodAutoscaler(
				hpaName,
				process.env.NAMESPACE
			);

			response.body.spec.minReplicas = minReplicas;
			response.body.spec.maxReplicas = maxReplicas;

			// Update the deployment
			await k8sApi.replaceNamespacedHorizontalPodAutoscaler(
				hpaName,
				process.env.NAMESPACE,
				response.body
			);
		} catch (err) {
			logger.error(`Cannot update HPA '${hpaName}'`, { details: err });
		}
	}

	/**
	 * Updates a cluster's other resource.
	 * @param {string} name - The name of the resource.
	 * @param {string} instance - The instance of the resource.
	 * @param {object} config - The configuration object.
	 * @returns {Promise<void>} - A promise that resolves when the update is complete.
	 */
	async updateClusterOtherResource(name, instance, config) {
		try {
			switch (instance) {
				case "Redis":
					await updateRedis(name, config.version, config.size, false);
					break;
				case "RabbitMQ":
					await updateRabbitmqCluster(
						name,
						config.version,
						config.size,
						config.replicas
					);
					break;
				case "MongoDB":
					await updateMongoDBResource(
						name,
						config.version,
						config.size,
						config.replicas
					);
					break;
				case "Minio":
					await updateMinioStorageSize(name, config.size);
					break;
				default:
					break;
			}
		} catch (err) {
			logger.error(`Cannot update cluster resource '${name}'.${err.message}`, {
				details: err,
			});
		}
	}

	/**
	 * Returns information about the app version's API server
	 * @param  {string} envId The environment id
	 */
	async getAPIServerInfo(envId) {
		// Create a Kubernetes core API client
		const kubeconfig = new k8s.KubeConfig();
		kubeconfig.loadFromDefault();
		const k8sApi = kubeconfig.makeApiClient(k8s.CustomObjectsApi);

		try {
			const revResponse = await k8sApi.listNamespacedCustomObject(
				"serving.knative.dev",
				"v1",
				process.env.NAMESPACE,
				"revisions",
				undefined,
				undefined,
				undefined,
				undefined,
				`app=${envId}`
			);

			let finalStatus = "Idle";
			let totalAvailable = 0;
			const revisions = revResponse.body.items;

			for (let index = 0; index < revisions.length; index++) {
				const revision = revisions[index];
				const { status, runningReplicas } = await this.checkAPIServerStatus(
					revision.metadata.name
				);
				totalAvailable += runningReplicas;
			}

			if (totalAvailable > 0) finalStatus = "OK";

			const ksResponse = await k8sApi.getNamespacedCustomObjectStatus(
				"serving.knative.dev",
				"v1",
				process.env.NAMESPACE,
				"services",
				envId
			);

			const annotations =
				ksResponse.body?.spec?.template?.metadata?.annotations ?? {};
			let container = ksResponse.body.spec.template.spec.containers[0];

			return {
				name: envId,
				status: finalStatus,
				initialScale: annotations["autoscaling.knative.dev/initial-scale"],
				maxScale: annotations["autoscaling.knative.dev/max-scale"],
				minScale: annotations["autoscaling.knative.dev/min-scale"],
				scaleDownDelay: annotations["autoscaling.knative.dev/scale-down-delay"],
				scaleToZeroPodRetentionPeriod:
					annotations[
						"autoscaling.knative.dev/scale-to-zero-pod-retention-period"
					],
				runningReplicas: totalAvailable,
				version: container.image.split(":")[1],
			};
		} catch (err) {
			throw new AgnostError(err.body?.message);
		}
	}

	/**
	 * Returns the status of the API server
	 * @param  {object} connSettings The connection settings needed to connect to the API server
	 */
	async checkAPIServerStatus(deploymentName) {
		if (!deploymentName) return { status: "Error", runningReplicas: 0 };

		// Create a Kubernetes core API client
		const kubeconfig = new k8s.KubeConfig();
		kubeconfig.loadFromDefault();
		const coreApi = kubeconfig.makeApiClient(k8s.AppsV1Api);

		let result = null;
		try {
			result = await coreApi.readNamespacedDeployment(
				`${deploymentName}-deployment`,
				process.env.NAMESPACE
			);
		} catch (err) {
			return { status: "Error", runningReplicas: 0 };
		}

		return {
			status: result.body?.status?.availableReplicas > 0 ? "OK" : "Idle",
			runningReplicas: result.body?.status?.availableReplicas ?? 0,
		};
	}

	/**
	 * Returns the database object pointing to the MongoDB database of the engine cluster, which is used to store environment configuration info
	 */
	getPlatformDB() {
		if (!this.platformDB) {
			if (!this.conn) {
				this.conn = getDBClient();
			}
			this.platformDB = this.conn.db("agnost");
		}

		return this.platformDB;
	}

	/**
	 * Retrieves the cluster record from the database.
	 * @returns {Promise<Object>} The cluster record.
	 */
	async getClusterRecord() {
		return null;
		/* 		if (!this.conn) {
			this.conn = getDBClient();
		}

		// Get cluster configuration
		return await this.conn.db("agnost").collection("clusters").findOne({
			clusterAccesssToken: process.env.CLUSTER_ACCESS_TOKEN,
		}); */
	}

	/**
	 * Get release info
	 * @returns {Promise<Object>} The cluster record.
	 */
	async getAPIServerVersion() {
		if (process.env.NODE_ENV === "development") return null;

		try {
			const clusterInfo = await this.getClusterRecord();
			const releaseInfo = await axios.get(
				`https://raw.githubusercontent.com/cloud-agnost/agnost-community/master/releases/${clusterInfo.release}.json`,
				{
					headers: {
						Accept: "application/vnd.github.v3+json",
					},
				}
			);

			return releaseInfo.data.modules["engine-core"];
		} catch (err) {
			return null;
		}
	}

	/**
	 * Updates the access settings of the resource
	 */
	async updateResourceAccessSettings(access, accessReadOnly) {
		const resource = this.getResource();
		// Encrypt sensitive access data
		access = helper.encyrptSensitiveData(access);
		if (accessReadOnly)
			accessReadOnly = helper.encyrptSensitiveData(accessReadOnly);

		// Update resource access and access read only settings
		await cntrCtrl.updateOneById(
			resource._id,
			{
				$set: {
					access,
					accessReadOnly,
				},
			},
			{},
			{ cacheKey: resource._id }
		);
	}

	/**
	 * Updates the read-only replica access settings of the resource
	 */
	async updateResourceReadOnlyAccessSettings(accessReadOnly) {
		const resource = this.getResource();

		// Encrypt sensitive access data
		accessReadOnly = helper.encyrptSensitiveData(accessReadOnly);
		try {
			// Update the resource log object
			await axios.post(
				`${helper.getPlatformUrl()}/v1/org/${resource.orgId}/resource/${
					resource._id
				}/update-read-access-settings`,
				accessReadOnly,
				{
					headers: {
						Authorization: process.env.MASTER_TOKEN,
						"Content-Type": "application/json",
					},
				}
			);
		} catch (err) {}
	}

	/**
	 * Creates a new Redis cache
	 */
	async createRedisCache() {
		const resource = this.getResource();
		if (resource.config.readReplica)
			this.addLog(
				t(
					"Creating '%s'GB Redis cache '%s' with a read-replica.",
					resource.config.size,
					resource.name
				)
			);
		else
			this.addLog(
				t(
					"Creating '%s'GB Redis cache '%s' without a read-replica.",
					resource.config.size,
					resource.name
				)
			);

		await createRedis(
			resource.name,
			resource.config.version,
			resource.config.size,
			resource.config.password,
			resource.config.readReplica
		);

		const access = {
			host: `${resource.name}-master.${process.env.NAMESPACE}.svc.cluster.local`,
			password: resource.config.password,
			port: 6379,
		};

		const accessReadOnly = [];
		if (resource.config.readReplica) {
			accessReadOnly.push({
				host: `${resource.name}-replicas.${process.env.NAMESPACE}.svc.cluster.local`,
				password: resource.config.password,
				port: 6379,
			});
		}

		// Update resource access settings
		await this.updateResourceAccessSettings(access, accessReadOnly);
	}

	/**
	 * Creates a new RabbitMQ cluster
	 */
	async createRabbitMQMessageBroker() {
		const resource = this.getResource();
		this.addLog(
			t(
				"Creating RabbitMQ cluster '%s' with '%s' replica(s) and '%s' persistent storage.",
				resource.name,
				resource.config.replicas,
				resource.config.size
			)
		);

		await createRabbitmqCluster(
			resource.name,
			resource.config.version,
			resource.config.size,
			resource.config.username,
			resource.config.password,
			resource.config.replicas
		);

		const access = {
			host: `${resource.name}.${process.env.NAMESPACE}.svc.cluster.local`,
			port: 5672,
			username: resource.config.username,
			password: resource.config.password,
			scheme: "amqp",
			vhost: "",
			format: "object",
		};

		// Update resource access settings
		await this.updateResourceAccessSettings(access, []);
	}

	/**
	 * Creates a new MongoDB replica set
	 */
	async createMongoDBReplicaSet() {
		const resource = this.getResource();
		this.addLog(
			t(
				"Creating MongoDB replica set '%s' with '%s' replica(s) and '%s' storage size.",
				resource.name,
				resource.config.replicas,
				resource.config.size
			)
		);

		await createMongoDBResource(
			resource.name,
			resource.config.version,
			resource.config.size,
			resource.config.username,
			resource.config.password,
			resource.config.replicas
		);

		const access = {
			connFormat: "mongodb",
			host: `${resource.name}-svc.${process.env.NAMESPACE}.svc.cluster.local`,
			port: 27017,
			username: resource.config.username,
			password: resource.config.password,
		};

		// Update resource access settings
		await this.updateResourceAccessSettings(access, []);
	}

	/**
	 * Creates a new PostgreSQL database server
	 */
	async createPostgreSQLCluster() {
		const resource = this.getResource();
		this.addLog(
			t(
				"Creating PostgreSQL database server '%s' with '%s' instance(s) and '%s' storage size.",
				resource.name,
				resource.config.instances,
				resource.config.size
			)
		);

		await createPostgresql(
			resource.name,
			resource.config.version,
			resource.config.size,
			resource.config.instances
		);
		const secretName =
			"postgres." + resource.name + ".credentials.postgresql.acid.zalan.do";
		const password = await waitForSecret(secretName);

		const access = {
			host: `${resource.name}.${process.env.NAMESPACE}.svc.cluster.local`,
			port: 5432,
			username: "postgres",
			password: Buffer.from(password, "base64").toString("utf-8"),
		};

		const accessReadOnly = [];
		if (resource.config.instances > 1) {
			accessReadOnly.push({
				host: `${resource.name}-repl.${process.env.NAMESPACE}.svc.cluster.local`,
				port: 5432,
				username: "postgres",
				password: Buffer.from(password, "base64").toString("utf-8"),
			});
		}
		// Update resource access settings
		await this.updateResourceAccessSettings(access, accessReadOnly);
	}

	/**
	 * Creates a new MySQL database server
	 */
	async createMySQLCluster() {
		const resource = this.getResource();
		this.addLog(
			t(
				"Creating MySQL database server '%s' with '%s' instance(s) and '%s' storage size.",
				resource.name,
				resource.config.instances,
				resource.config.size
			)
		);

		await createMySQLResource(
			resource.name,
			resource.config.version,
			resource.config.instances,
			resource.config.size,
			resource.config.username,
			resource.config.password
		);

		const access = {
			host: `${resource.name}.${process.env.NAMESPACE}.svc.cluster.local`,
			port: 3306,
			username: resource.config.username,
			password: resource.config.password,
		};

		const accessReadOnly = [];
		if (resource.config.instances > 1) {
			accessReadOnly.push({
				host: `${resource.name}.${process.env.NAMESPACE}.svc.cluster.local`,
				port: 6447, // Readonly port
				username: resource.config.username,
				password: resource.config.password,
			});
		}

		// Update resource access settings
		await this.updateResourceAccessSettings(access, accessReadOnly);
	}

	/**
	 * Retrieves the IP addresses of the cluster's load balancer ingress.
	 * @returns {Promise<string[]>} An array of IP addresses.
	 * @throws {AgnostError} If there is an error retrieving the IP addresses.
	 */
	async getClusterIPAddresses() {
		try {
			// Create a Kubernetes core API client
			const kubeconfig = new k8s.KubeConfig();
			kubeconfig.loadFromDefault();
			const k8sApi = kubeconfig.makeApiClient(k8s.NetworkingV1Api);

			const result = await k8sApi.readNamespacedIngress(
				"platform-core-ingress",
				process.env.NAMESPACE
			);
			const ingress = result.body;
			return ingress.status.loadBalancer.ingress.map(
				(ing) => ing.ip || ing.hostname
			);
		} catch (err) {
			throw new AgnostError(err.body?.message);
		}
	}

	/**
	 * Returns the secret names associated with the cluster custom domains.
	 */
	async getClusterDomainSecrets() {
		try {
			// Create a Kubernetes core API client
			const kubeconfig = new k8s.KubeConfig();
			kubeconfig.loadFromDefault();
			const k8sApi = kubeconfig.makeApiClient(k8s.NetworkingV1Api);

			const result = await k8sApi.readNamespacedIngress(
				"platform-core-ingress",
				process.env.NAMESPACE
			);
			const ingress = result.body;

			const secrets = ingress.spec.tls
				? ingress.spec.tls.map((entry) => {
						return { domainName: entry.hosts[0], secretName: entry.secretName };
				  })
				: [];

			return secrets;
		} catch (err) {
			throw new AgnostError(err.body?.message);
		}
	}

	/**
	 * Initializes the certificate issuer.
	 * This function checks if the certificate issuer already exists, and if not, creates it.
	 * @returns {Promise<void>} A promise that resolves when the initialization is complete.
	 */
	async initializeCertificateIssuer() {
		// Create a Kubernetes core API client
		const kubeconfig = new k8s.KubeConfig();
		kubeconfig.loadFromDefault();
		const customApi = kubeconfig.makeApiClient(k8s.CustomObjectsApi);

		try {
			// Check to see if we have the certificate issuer already
			await customApi.getNamespacedCustomObject(
				"cert-manager.io",
				"v1",
				process.env.NAMESPACE,
				"issuers",
				"letsencrypt-issuer-cluster"
			);

			return;
		} catch (err) {
			// If we get a 404, we need to create the issuer
			if (err.statusCode === 404) {
				const issuer = {
					apiVersion: "cert-manager.io/v1",
					kind: "Issuer",
					metadata: {
						name: "letsencrypt-issuer-cluster",
						namespace: process.env.NAMESPACE,
					},
					spec: {
						acme: {
							privateKeySecretRef: {
								name: "letsencrypt-issuer-key",
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

				await customApi.createNamespacedCustomObject(
					"cert-manager.io",
					"v1",
					process.env.NAMESPACE,
					"issuers",
					issuer
				);
			}
		}
	}

	/**
	 * Adds a custom domain to a cluster ingress.
	 * @param {string} ingressName - The name of the ingress.
	 * @param {string} domainName - The domain name to be added.
	 * @param {string} secretName - The ssl certificate secret name.
	 * @param {boolean} [enforceSSLAccess=false] - Whether to enforce SSL access to the domain.
	 * @returns {Promise<void>} - A promise that resolves when the custom domain is added successfully.
	 */
	async addClusterCustomDomain(
		ingressName,
		domainName,
		secretName,
		enforceSSLAccess = false
	) {
		try {
			const kc = new k8s.KubeConfig();
			kc.loadFromDefault();
			const k8sExtensionsApi = kc.makeApiClient(k8s.NetworkingV1Api);
			const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);

			const ingress = await k8sExtensionsApi.readNamespacedIngress(
				ingressName,
				process.env.NAMESPACE
			);

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

			ingress.body.metadata.annotations["cert-manager.io/issuer"] =
				"letsencrypt-issuer-cluster";
			if (ingress.body.spec.tls) {
				ingress.body.spec.tls.push({
					hosts: [domainName],
					secretName: secretName,
				});
			} else {
				ingress.body.spec.tls = [
					{
						hosts: [domainName],
						secretName: secretName,
					},
				];
			}

			// The default ingress rules is the last one, all new ones are added to the beginning of the rules array
			const ruleCopy = JSON.parse(
				JSON.stringify(
					ingress.body.spec.rules[ingress.body.spec.rules.length - 1]
				)
			);
			ruleCopy.host = domainName;
			// Add it to the beginning of the rules array
			ingress.body.spec.rules.unshift(ruleCopy);

			const requestOptions = {
				headers: { "Content-Type": "application/merge-patch+json" },
			};
			await k8sExtensionsApi.patchNamespacedIngress(
				ingressName,
				process.env.NAMESPACE,
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
				`Cannot add custom domain '${domainName}' to ingress '${ingressName}'`,
				{ details: err }
			);
		}
	}

	/**
	 * Deletes custom domains from a cluster's ingress.
	 * @param {string} ingressName - The name of the ingress.
	 * @param {string[]} domainNames - An array of domain names to be deleted.
	 * @returns {Promise<void>} - A promise that resolves when the custom domains are deleted successfully, or rejects with an error.
	 */
	async deleteClusterCustomDomains(ingressName, domainNames) {
		try {
			const kc = new k8s.KubeConfig();
			kc.loadFromDefault();
			const k8sExtensionsApi = kc.makeApiClient(k8s.NetworkingV1Api);
			const ingress = await k8sExtensionsApi.readNamespacedIngress(
				ingressName,
				process.env.NAMESPACE
			);

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
				delete ingress.body.metadata.annotations["cert-manager.io/issuer"];
			}

			// Update rules
			ingress.body.spec.rules = ingress.body.spec.rules.filter(
				(rule) => !domainNames.includes(rule.host)
			);

			const requestOptions = {
				headers: { "Content-Type": "application/merge-patch+json" },
			};
			await k8sExtensionsApi.replaceNamespacedIngress(
				ingressName,
				process.env.NAMESPACE,
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
				)}' to ingress '${ingressName}'`,
				{
					details: err,
				}
			);
		}
	}

	/**
	 * Updates the enforceSSLAccess settings for the specified ingress.
	 * @param {string} ingressName - The name of the ingress.
	 * @param {boolean} [enforceSSLAccess=false] - Whether to enforce SSL access. Default is false.
	 * @returns {Promise<void>} - A Promise that resolves when the update is complete.
	 */
	async updateEnforceSSLAccessSettings(ingressName, enforceSSLAccess = false) {
		try {
			const kc = new k8s.KubeConfig();
			kc.loadFromDefault();
			const k8sExtensionsApi = kc.makeApiClient(k8s.NetworkingV1Api);

			const ingress = await k8sExtensionsApi.readNamespacedIngress(
				ingressName,
				process.env.NAMESPACE
			);

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

			ingress.body.metadata.annotations["cert-manager.io/issuer"] =
				"letsencrypt-issuer-cluster";

			const requestOptions = {
				headers: { "Content-Type": "application/merge-patch+json" },
			};
			await k8sExtensionsApi.patchNamespacedIngress(
				ingressName,
				process.env.NAMESPACE,
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

	/**
	 * Restarts the MySQL Operator by triggering a rollout of the deployment.
	 * @returns {Promise<void>} A promise that resolves when the restart is complete.
	 */
	async restartMySQLOperator() {
		try {
			const kc = new k8s.KubeConfig();
			kc.loadFromDefault();
			const k8sApi = kc.makeApiClient(k8s.AppsV1Api);

			// Get the current deployment
			const currentDeployment = await k8sApi.readNamespacedDeployment(
				"mysql-operator",
				process.env.NAMESPACE === "default"
					? "operators"
					: `${process.env.NAMESPACE}-operators`
			);

			const container = currentDeployment.body.spec.template.spec.containers[0];
			container.env.push({
				name: "RESTART_TIMESTAMP",
				value: new Date().toISOString(),
			});

			// Apply the changes using the replaceNamespacedDeployment function
			await k8sApi.replaceNamespacedDeployment(
				"mysql-operator",
				process.env.NAMESPACE === "default"
					? "operators"
					: `${process.env.NAMESPACE}-operators`,
				currentDeployment.body
			);
		} catch (err) {
			logger.error(`Cannot restart the mysql-operator.${err.message}`, {
				details: err,
			});
		}
	}

	/**
	 * Creates a custom domain ingress.
	 *
	 * @param {string} ingressName - The name of the ingress.
	 * @param {string} domainName - The domain name.
	 * @param {string} serviceName - The name of the service.
	 * @param {number} port - The port number.
	 * @returns {Promise<void>} - A promise that resolves when the custom domain ingress is created.
	 */
	async createCustomDomainIngress(ingressName, domainName, serviceName, port) {
		// Create a Kubernetes core API client
		const kubeconfig = new k8s.KubeConfig();
		kubeconfig.loadFromDefault();
		const networkingApi = kubeconfig.makeApiClient(k8s.NetworkingV1Api);

		try {
			const ingress = {
				apiVersion: "networking.k8s.io/v1",
				kind: "Ingress",
				metadata: {
					name: `${ingressName}-ingress`,
					annotations: {
						"nginx.ingress.kubernetes.io/proxy-body-size": "500m",
						"nginx.ingress.kubernetes.io/proxy-connect-timeout": "6000",
						"nginx.ingress.kubernetes.io/proxy-send-timeout": "6000",
						"nginx.ingress.kubernetes.io/proxy-read-timeout": "6000",
						"nginx.ingress.kubernetes.io/proxy-next-upstream-timeout": "6000",
						"nginx.ingress.kubernetes.io/ssl-redirect": "true",
						"nginx.ingress.kubernetes.io/force-ssl-redirect": "true",
						"cert-manager.io/issuer": "letsencrypt-issuer-cluster",
					},
				},
				spec: {
					ingressClassName: "nginx",
					tls: [
						{
							hosts: [domainName],
							secretName: `${ingressName}-tls`,
						},
					],
					rules: [
						{
							host: domainName,
							http: {
								paths: [
									{
										path: `/`,
										pathType: "Prefix",
										backend: {
											service: {
												name: `${serviceName}`,
												port: { number: port },
											},
										},
									},
								],
							},
						},
					],
				},
			};

			// Create the ingress with the provided spec
			await networkingApi.createNamespacedIngress(
				process.env.NAMESPACE,
				ingress
			);
		} catch (err) {
			throw new AgnostError(err.body?.message);
		}
	}

	/**
	 * Deletes the custom domain ingress.
	 *
	 * @param {string} ingressName - The name of the ingress.
	 * @returns {Promise<void>} - A promise that resolves when the custom domain ingress is deleted.
	 */
	async deleteCustomDomainIngress(ingressName) {
		// Create a Kubernetes core API client
		const kubeconfig = new k8s.KubeConfig();
		kubeconfig.loadFromDefault();
		const networkingApi = kubeconfig.makeApiClient(k8s.NetworkingV1Api);

		try {
			// Delete the ingress resource
			await networkingApi.deleteNamespacedIngress(
				`${ingressName}-ingress`,
				process.env.NAMESPACE
			);
		} catch (err) {
			throw new AgnostError(err.body?.message);
		}
	}

	/**
	 * Enables the TCP proxy for the service, mainly exposes the service to outside world through ingress at a specific port number
	 *
	 * @param {string} serviceName - The name of the service to enable TCP proxy.
	 * @param {number} portNumber - The port number to open.
	 * @param {number} resourcePort - The resource object port number (internal resource port number).
	 * @returns {Promise<void>} - A promise that resolves when the TCP proxy is enabled.
	 */
	async exposeService(serviceName, portNumber, resourcePort) {
		/*  We need to patch below on ingress-nginx namespace:
            1. ConfigMap/tcp-services
            2. Service/ingress-nginx-controller
            3. Deployment/ingress-nginx-controller */

		// Kubernetes client configuration
		const kc = new k8s.KubeConfig();
		kc.loadFromDefault();
		const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
		const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
		const namespace = process.env.NAMESPACE;
		const configMapName = "tcp-services";
		const resourceNamespace = "ingress-nginx";

		try {
			var svcPort = resourcePort;
			// get the backend service information
			var backendSvc = await k8sCoreApi.readNamespacedService(
				serviceName,
				namespace
			);
			var protocol =
				backendSvc.body.spec.ports.find((entry) => entry.port === svcPort)
					.protocol ?? "TCP";
		} catch (error) {
			throw new AgnostError(error.body?.message);
		}

		try {
			// patch configmap/tcp-service
			const cfgmap = await k8sCoreApi.readNamespacedConfigMap(
				configMapName,
				resourceNamespace
			);

			cfgmap.body.data = {
				...cfgmap.body.data,
				[portNumber]: `${namespace}/${serviceName}:${svcPort}`,
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
					data: { [portNumber]: `${namespace}/${serviceName}:${svcPort}` },
				};
				await k8sCoreApi.createNamespacedConfigMap(
					resourceNamespace,
					configMap
				);
			} else {
				throw new AgnostError(error.body?.message);
			}
		}

		try {
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
							dply.body.spec.template.spec.containers[0].args.push(
								configmapArg
							);
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
		} catch (error) {
			throw new AgnostError(error.body?.message);
		}
	}

	async unexposeService(portNumber) {
		const kc = new k8s.KubeConfig();
		kc.loadFromDefault();
		const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
		const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
		const configMapName = "tcp-services";
		const resourceNamespace = "ingress-nginx";

		try {
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
		} catch (error) {
			throw new AgnostError(error.body?.message);
		}
	}

	async unexposeServices(portNumbers) {
		const kc = new k8s.KubeConfig();
		kc.loadFromDefault();
		const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
		const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
		const configMapName = "tcp-services";
		const resourceNamespace = "ingress-nginx";

		try {
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

			portNumbers = portNumbers.map((portNumber) => portNumber.toString());

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
		} catch (error) {
			throw new AgnostError(error.body?.message);
		}
	}
}
