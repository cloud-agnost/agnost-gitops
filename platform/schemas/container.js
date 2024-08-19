import mongoose from "mongoose";
import { body } from "express-validator";
import deploymentRules from "./rules/deployment.js";
import statefulSetRules from "./rules/statefulSet.js";
import cronJobRules from "./rules/cronJob.js";
import { containerTypes, providerTypes } from "../config/constants.js";
import { templates } from "../handlers/templates/index.js";

/**
 * A container is an entitiy created in the Kubernetes cluster this can be a deployment, stateful set or cron job
 */
export const ContainerModel = mongoose.model(
	"container",
	new mongoose.Schema(
		{
			orgId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "organization",
				index: true,
			},
			projectId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "project",
				index: true,
			},
			environmentId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "environment",
				index: true,
			},
			iid: {
				// Internal identifier
				type: String,
				required: true,
				index: true,
				immutable: true,
			},
			slug: {
				// Internal identifier
				type: String,
				required: true,
				index: true,
				immutable: true,
			},
			name: {
				type: String,
				required: true,
				index: true,
			},
			type: {
				type: String,
				required: true,
				index: true,
				immutable: true,
				enum: containerTypes,
			},
			template: {
				name: {
					type: String,
					index: true,
					immutable: true,
				},
				manifest: {
					type: String,
					index: true,
					immutable: true,
				},
				version: {
					type: String,
					index: true,
					immutable: true,
				},
			},
			status: {
				type: mongoose.Schema.Types.Mixed,
			},
			latestImages: [
				{
					type: mongoose.Schema.Types.Mixed,
				},
			],
			pipelineStatus: {
				type: String,
			},
			variables: [
				{
					name: {
						type: String,
					},
					value: {
						type: String,
					},
				},
			],
			repoOrRegistry: {
				type: String,
				required: true,
				index: true,
				immutable: true,
				enum: ["repo", "registry"],
				default: "repo",
			},
			repo: {
				type: {
					type: String,
					enum: providerTypes,
				},
				// Whether the repo is connected or not
				connected: {
					type: Boolean,
					default: false,
				},
				// Full name of the repo
				name: {
					type: String,
				},
				url: {
					type: String,
				},
				branch: {
					type: String,
				},
				// For monorepos the directory path to the container
				path: {
					type: String,
					default: "/",
				},
				// The name of the docker file in the repository
				dockerfile: {
					type: String,
					default: "Dockerfile",
				},
				gitProviderId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "git_provider",
					index: true,
				},
				webHookId: {
					type: String,
				},
				// Mainly used to store project/repo id (required for gitlab but not required for gibhub)
				repoId: {
					type: String,
				},
			},
			registry: {
				registryId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "registry",
					index: true,
				},
				imageName: {
					type: String,
				},
				imageTag: {
					type: String,
				},
				imageUrl: {
					// This is the full path to the image in the registry
					// e.g. quay.io/minio/minio:RELEASE.2024-05-10T01-41-38Z
					type: String,
				},
			},
			networking: {
				// The port number the container listens on
				containerPort: {
					type: Number,
				},
				// Flag specifies whether the container is accessible from the public internet or not through a TCP proxy
				ingress: {
					enabled: {
						type: Boolean,
						default: false,
					},
					type: {
						type: String,
						enum: ["path", "subdomain"],
						default: "subdomain",
					},
					// Custom path for the ingress, populated only if the ingress type is path (currently used only by platform and sync deployments of the cluster)
					path: {
						type: String,
					},
				},
				customDomain: {
					enabled: {
						type: Boolean,
						default: false,
					},
					domain: {
						type: String,
					},
				},
				tcpProxy: {
					enabled: {
						type: Boolean,
						default: false,
					},
					// The port number the container is exposed on the host, populated only if the container is public
					publicPort: {
						type: Number,
					},
				},
			},
			podConfig: {
				restartPolicy: {
					type: String,
					enum: ["Always", "OnFailure", "Never"],
					default: "Always",
				},
				cpuRequest: {
					type: Number,
					default: 100,
				},
				cpuRequestType: {
					type: String,
					enum: ["millicores", "cores"],
					default: "millicores",
				},
				memoryRequest: {
					type: Number,
					default: 128,
				},
				memoryRequestType: {
					type: String,
					enum: ["mebibyte", "gibibyte"],
					default: "mebibyte",
				},
				cpuLimit: {
					type: Number,
					default: 1,
				},
				cpuLimitType: {
					type: String,
					enum: ["millicores", "cores"],
				},
				memoryLimit: {
					type: Number,
					default: 1024,
				},
				memoryLimitType: {
					type: String,
					enum: ["mebibyte", "gibibyte"],
					default: "mebibyte",
				},
			},
			storageConfig: {
				enabled: {
					type: Boolean,
					default: false,
				},
				mountPath: {
					type: String,
				},
				size: {
					type: Number,
					default: 1,
				},
				sizeType: {
					type: String,
					enum: ["mebibyte", "gibibyte"],
					default: "gibibyte",
				},
				accessModes: {
					type: [String],
					enum: ["ReadWriteOnce", "ReadOnlyMany", "ReadWriteMany"],
					default: ["ReadWriteOnce"],
				},
			},
			deploymentConfig: {
				desiredReplicas: {
					type: Number,
					default: 1,
				},
				minReplicas: {
					type: Number,
					default: 1,
				},
				maxReplicas: {
					type: Number,
					default: 1,
				},
				cpuMetric: {
					enabled: {
						type: Boolean,
						default: false,
					},
					metricType: {
						type: String,
						enum: [
							"AverageUtilization",
							"AverageValueMillicores",
							"AverageValueCores",
						],
					},
					metricValue: {
						type: Number,
					},
				},
				memoryMetric: {
					enabled: {
						type: Boolean,
						default: false,
					},
					metricType: {
						type: String,
						enum: ["AverageValueMebibyte", "AverageValueGibibyte"],
					},
					metricValue: {
						type: Number,
					},
				},
				strategy: {
					type: String,
					enum: ["RollingUpdate", "Recreate"],
					default: "RollingUpdate",
				},
				rollingUpdate: {
					maxSurge: {
						type: Number,
						default: 30,
					},
					maxSurgeType: {
						type: String,
						enum: ["number", "percentage"],
						default: "percentage",
					},
					maxUnavailable: {
						type: Number,
						default: 0,
					},
					maxUnavailableType: {
						type: String,
						enum: ["number", "percentage"],
						default: "number",
					},
				},
				revisionHistoryLimit: {
					type: Number,
					default: 10,
				},
			},
			statefulSetConfig: {
				desiredReplicas: {
					type: Number,
					default: 1,
				},
				strategy: {
					type: String,
					enum: ["RollingUpdate", "Recreate"],
					default: "RollingUpdate",
				},
				rollingUpdate: {
					maxUnavailable: {
						type: Number,
						default: 1,
					},
					maxUnavailableType: {
						type: String,
						enum: ["number", "percentage"],
						default: "number",
					},
					partition: {
						type: Number,
						default: 0,
					},
				},
				revisionHistoryLimit: {
					type: Number,
					default: 10,
				},
				podManagementPolicy: {
					type: String,
					enum: ["OrderedReady", "Parallel"],
					default: "OrderedReady",
				},
				persistentVolumeClaimRetentionPolicy: {
					whenDeleted: {
						type: String,
						enum: ["Retain", "Delete"],
						default: "Retain",
					},
					whenScaled: {
						type: String,
						enum: ["Retain", "Delete"],
						default: "Delete",
					},
				},
			},
			cronJobConfig: {
				schedule: {
					type: String,
				},
				timeZone: {
					type: String,
					default: "UTC",
				},
				concurrencyPolicy: {
					type: String,
					enum: ["Allow", "Forbid", "Replace"],
					default: "Allow",
				},
				suspend: {
					type: Boolean,
					default: false,
				},
				successfulJobsHistoryLimit: {
					type: Number,
					default: 5,
				},
				failedJobsHistoryLimit: {
					type: Number,
					default: 5,
				},
			},
			probes: {
				startup: {
					enabled: {
						type: Boolean,
						default: false,
					},
					checkMechanism: {
						type: String,
						enum: ["exec", "httpGet", "tcpSocket"],
						defau: ["httpGet"],
					},
					execCommand: {
						type: String,
					},
					httpPath: {
						type: String,
					},
					httpPort: {
						type: Number,
					},
					tcpPort: {
						type: Number,
					},
					initialDelaySeconds: {
						type: Number,
						default: 30,
					},
					periodSeconds: {
						type: Number,
						default: 30,
					},
					timeoutSeconds: {
						type: Number,
						default: 10,
					},
					failureThreshold: {
						type: Number,
						default: 3,
					},
				},
				readiness: {
					enabled: {
						type: Boolean,
						default: false,
					},
					checkMechanism: {
						type: String,
						enum: ["exec", "httpGet", "tcpSocket"],
						defau: ["httpGet"],
					},
					execCommand: {
						type: String,
					},
					httpPath: {
						type: String,
					},
					httpPort: {
						type: Number,
					},
					tcpPort: {
						type: Number,
					},
					initialDelaySeconds: {
						type: Number,
						default: 30,
					},
					periodSeconds: {
						type: Number,
						default: 30,
					},
					timeoutSeconds: {
						type: Number,
						default: 10,
					},
					failureThreshold: {
						type: Number,
						default: 3,
					},
				},
				liveness: {
					enabled: {
						type: Boolean,
						default: false,
					},
					checkMechanism: {
						type: String,
						enum: ["exec", "httpGet", "tcpSocket"],
						defau: ["httpGet"],
					},
					execCommand: {
						type: String,
					},
					httpPath: {
						type: String,
					},
					httpPort: {
						type: Number,
					},
					tcpPort: {
						type: Number,
					},
					initialDelaySeconds: {
						type: Number,
						default: 30,
					},
					periodSeconds: {
						type: Number,
						default: 30,
					},
					timeoutSeconds: {
						type: Number,
						default: 10,
					},
					failureThreshold: {
						type: Number,
						default: 3,
					},
				},
			},
			createdBy: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "user",
			},
			updatedBy: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "user",
			},
			isClusterEntity: {
				type: Boolean,
				default: false,
			},
			__v: {
				type: Number,
				select: false,
			},
		},
		{ timestamps: true }
	)
);

// Function to execute an array of middlewares
const executeMiddlewareArray = (middlewares, req, res, next) => {
	const execute = (index) => {
		if (index < middlewares.length) {
			middlewares[index](req, res, () => execute(index + 1));
		} else {
			next();
		}
	};
	execute(0);
};

/**
 * Applies rules based on the action type for incoming requests.
 * @param {string} actionType - The type of action being performed.
 * @returns {Function} - Middleware function to be executed.
 */
export const applyRules = (actionType) => {
	return function (req, res, next) {
		// Remove the data that cannot be updated
		if (actionType === "update") {
			// We do not allow for type and repo/registry changes
			req.body.type = req.container.type;
			req.body.repoOrRegistry = req.container.repoOrRegistry;

			// Delete fields that cannot be updated
			delete req.body._id;
			delete req.body.iid;
			delete req.body.orgId;
			delete req.body.projectId;
			delete req.body.environmentId;
			delete req.body.status;
			delete req.body.pipelineStatus;
			delete req.body.createdBy;
			delete req.body.createdAt;
			delete req.body.updatedAt;
			delete req.body.updatedBy;
			delete req.body.isClusterEntity;
			delete req.body.template;
		}

		if (req.body.type === "deployment") {
			// Clear unrelated fields for update
			if (actionType === "update") {
				delete req.body.statefulSetConfig; // delete statefulSetConfig
				delete req.body.cronJobConfig; // delete cronJobConfig
			}
			executeMiddlewareArray(deploymentRules(actionType), req, res, next);
		} else if (req.body.type === "statefulset") {
			// Clear unrelated fields for update
			if (actionType === "update") {
				delete req.body.deploymentConfig; // delete deploymentConfig
				delete req.body.cronJobConfig; // delete cronJobConfig
			}
			executeMiddlewareArray(statefulSetRules(actionType), req, res, next);
		} else if (req.body.type === "cronjob") {
			// Clear unrelated fields for update
			if (actionType === "update") {
				delete req.body.statefulSetConfig; // delete statefulSetConfig
				delete req.body.deploymentConfig; // delete deploymentConfig
				delete req.body.networking; // delete networking
				delete req.body.probes; // delete probes
			}
			executeMiddlewareArray(cronJobRules(actionType), req, res, next);
		} else
			executeMiddlewareArray(
				[
					body("type")
						.trim()
						.notEmpty()
						.withMessage("Required field, cannot be left empty")
						.bail()
						.isIn(containerTypes)
						.withMessage("Unsupported resource type"),
				],
				req,
				res,
				next
			);
	};
};

/**
 * Validates the template name and type in the request body.
 *
 * @param {import("express-validator").ValidationChain[]} checkTemplate - The validation chain for the template name and type.
 * @returns {import("express-validator").ValidationChain[]} - The updated validation chain.
 */
export const checkTemplate = [
	body("template.name")
		.trim()
		.optional()
		.custom((value, { req }) => {
			let template = null;
			templates.forEach((category) => {
				category.templates.forEach((t) => {
					if (t.name === value && t.isLatest) {
						template = t;
					}
				});
			});

			if (template === null) {
				throw new Error(`Template '${value}' not found`);
			}

			if (req.body.type !== template.type) {
				throw new Error(
					`Template '${value}' is not supported for type ${req.body.type}`
				);
			}

			// Add the template to the request object
			req.template = template;
			return true;
		}),
];

const fields = [
	"variables",
	"repo.type",
	"repo.connected",
	"repo.name",
	"repo.url",
	"repo.branch",
	"repo.path",
	"repo.dockerfile",
	"repo.gitProviderId",
	"repo.webHookId",
	"registry.registryId",
	"registry.imageName",
	"registry.imageTag",
	"registry.imageUrl",
	"networking.containerPort",
	"networking.ingress.enabled",
	"networking.ingress.type",
	"networking.customDomain.enabled",
	"networking.customDomain.domain",
	"networking.tcpProxy.enabled",
	"networking.tcpProxy.publicPort",
	"podConfig.restartPolicy",
	"podConfig.cpuRequest",
	"podConfig.cpuRequestType",
	"podConfig.memoryRequest",
	"podConfig.memoryRequestType",
	"podConfig.cpuLimit",
	"podConfig.cpuLimitType",
	"podConfig.memoryLimit",
	"podConfig.memoryLimitType",
	"storageConfig.enabled",
	"storageConfig.mountPath",
	"storageConfig.size",
	"storageConfig.sizeType",
	"storageConfig.accessModes",
	"deploymentConfig.desiredReplicas",
	"deploymentConfig.minReplicas",
	"deploymentConfig.maxReplicas",
	"deploymentConfig.cpuMetric.enabled",
	"deploymentConfig.cpuMetric.metricType",
	"deploymentConfig.cpuMetric.metricValue",
	"deploymentConfig.memoryMetric.enabled",
	"deploymentConfig.memoryMetric.metricType",
	"deploymentConfig.memoryMetric.metricValue",
	"deploymentConfig.strategy",
	"deploymentConfig.rollingUpdate.maxSurge",
	"deploymentConfig.rollingUpdate.maxSurgeType",
	"deploymentConfig.rollingUpdate.maxUnavailable",
	"deploymentConfig.rollingUpdate.maxUnavailableType",
	"deploymentConfig.revisionHistoryLimit",
	"statefulSetConfig.desiredReplicas",
	"statefulSetConfig.strategy",
	"statefulSetConfig.rollingUpdate.maxUnavailable",
	"statefulSetConfig.rollingUpdate.maxUnavailableType",
	"statefulSetConfig.rollingUpdate.partition",
	"statefulSetConfig.revisionHistoryLimit",
	"statefulSetConfig.podManagementPolicy",
	"statefulSetConfig.persistentVolumeClaimRetentionPolicy.whenDeleted",
	"statefulSetConfig.persistentVolumeClaimRetentionPolicy.whenScaled",
	"cronJobConfig.schedule",
	"cronJobConfig.timeZone",
	"cronJobConfig.concurrencyPolicy",
	"cronJobConfig.suspend",
	"cronJobConfig.successfulJobsHistoryLimit",
	"cronJobConfig.failedJobsHistoryLimit",
	"probes.startup.enabled",
	"probes.startup.checkMechanism",
	"probes.startup.execCommand",
	"probes.startup.httpPath",
	"probes.startup.httpPort",
	"probes.startup.tcpPort",
	"probes.startup.initialDelaySeconds",
	"probes.startup.periodSeconds",
	"probes.startup.timeoutSeconds",
	"probes.startup.failureThreshold",
	"probes.readiness.enabled",
	"probes.readiness.checkMechanism",
	"probes.readiness.execCommand",
	"probes.readiness.httpPath",
	"probes.readiness.httpPort",
	"probes.readiness.tcpPort",
	"probes.readiness.initialDelaySeconds",
	"probes.readiness.periodSeconds",
	"probes.readiness.timeoutSeconds",
	"probes.readiness.failureThreshold",
	"probes.liveness.enabled",
	"probes.liveness.checkMechanism",
	"probes.liveness.execCommand",
	"probes.liveness.httpPath",
	"probes.liveness.httpPort",
	"probes.liveness.tcpPort",
	"probes.liveness.initialDelaySeconds",
	"probes.liveness.periodSeconds",
	"probes.liveness.timeoutSeconds",
	"probes.liveness.failureThreshold",
];

/**
 * Calculates and returns the list of fields that have changed between the old and new configurations.
 *
 * @param {object} oldConfig - The old configuration object.
 * @param {object} newConfig - The new configuration object.
 * @returns {string[]} - The list of fields that have changed.
 */
export function getValueChanges(oldConfig, newConfig) {
	const changes = [];
	for (const field of fields) {
		let oldValue = getFieldValue(field, oldConfig);
		let newValue = getFieldValue(field, newConfig);

		if (field === "variables") {
			if (hasVariablesChanged(oldValue ?? [], newValue ?? []))
				changes.push(field);
			else continue;
		}

		if (Array.isArray(oldValue) && Array.isArray(newValue)) {
			if (hasArrayValuesChanged(oldValue, newValue)) changes.push(field);
			else continue;
		}

		if (isObjectButNotArray(oldValue) || isObjectButNotArray(newValue)) {
			if (oldValue.toString() !== newValue.toString()) changes.push(field);
			else continue;
		}

		if (oldValue !== newValue) changes.push(field);
	}

	return changes;
}

/**
 * Retrieves the value of a field from a configuration object.
 *
 * @param {string} field - The field to retrieve the value from.
 * @param {object} config - The configuration object.
 * @returns {*} - The value of the field, or undefined if the field is not available.
 */
function getFieldValue(field, config) {
	const path = field.split(".");
	let object = config;
	for (let i = 0; i < path.length - 1; i++) {
		const field = path[i];
		// If the field is not available on the request body then continue to the next field
		if (!object[field]) {
			return undefined;
		}

		object = object[field];
	}

	return object[path[path.length - 1]];
}

/**
 * Checks if a value is an object but not an array.
 *
 * @param {*} value - The value to check.
 * @returns {boolean} - Returns `true` if the value is an object but not an array, otherwise `false`.
 */
function isObjectButNotArray(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Checks if the variables in two arrays have changed.
 *
 * @param {Array} array1 - The first array of variables.
 * @param {Array} array2 - The second array of variables.
 * @returns {boolean} - Returns true if the variables have changed, false otherwise.
 */
function hasVariablesChanged(array1, array2) {
	if (array1.length !== array2.length) return true;

	const sortedArray1 = array1
		.slice()
		.sort((a, b) => (a.name > b.name ? 1 : -1));
	const sortedArray2 = array2
		.slice()
		.sort((a, b) => (a.name > b.name ? 1 : -1));

	for (let i = 0; i < sortedArray1.length; i++) {
		const item1 = sortedArray1[i];
		const item2 = sortedArray2[i];

		if (item1.name !== item2.name || item1.value !== item2.value) return true;
	}

	return false;
}

/**
 * Checks if the values in two arrays have changed.
 *
 * @param {Array} array1 - The first array.
 * @param {Array} array2 - The second array.
 * @returns {boolean} - Returns true if the values in the arrays have changed, false otherwise.
 */
function hasArrayValuesChanged(array1, array2) {
	if (array1.length !== array2.length) return true;

	const sortedArray1 = array1.slice().sort((a, b) => (a > b ? 1 : -1));
	const sortedArray2 = array2.slice().sort((a, b) => (a > b ? 1 : -1));

	for (let i = 0; i < sortedArray1.length; i++) {
		const item1 = sortedArray1[i];
		const item2 = sortedArray2[i];

		if (item1 !== item2 || item1 !== item2) return true;
	}

	return false;
}
