import { body } from "express-validator";
import parser from "cron-parser";
import cntrCtrl from "../../controllers/container.js";
import domainCtrl from "../../controllers/domain.js";
import clsCtrl from "../../controllers/cluster.js";
import gitCtrl from "../../controllers/gitProvider.js";
import { timezones } from "../../config/timezones.js";

export const checkName = (containerType, actionType) => {
	return [
		body("name")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isLength({
				min: config.get("general.minNameLength"),
				max: config.get("general.maxTextLength"),
			})
			.withMessage(
				t(
					"Name must be minimum %s and maximum %s characters long",
					config.get("general.minNameLength"),
					config.get("general.maxTextLength")
				)
			)
			.custom(async (value, { req }) => {
				let containers = await cntrCtrl.getManyByQuery({
					environmentId: req.environment._id,
				});
				containers.forEach((container) => {
					if (
						container.name.toLowerCase() === value.toLowerCase() &&
						actionType === "create"
					)
						throw new AgnostError(
							t("A %s with the provided name already exists", containerType)
						);

					if (
						container.name.toLowerCase() === value.toLowerCase() &&
						actionType === "update" &&
						req.container._id.toString() !== container._id.toString()
					)
						throw new AgnostError(
							t("A %s with the provided name already exists", containerType)
						);
				});

				if (value.toLowerCase() === "this") {
					throw new AgnostError(
						t(
							"'%s' is a reserved keyword and cannot be used as version name",
							value
						)
					);
				}

				return true;
			}),
	];
};

export const checkRepoOrRegistry = (containerType, actionType) => {
	return [
		body("repoOrRegistry")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isIn(["repo", "registry"])
			.withMessage(t("Unsupported %s source type", containerType)),
	];
};

export const checkRepo = (containerType, actionType) => {
	return [
		body("repo.type")
			.if(
				(value, { req }) =>
					req.body.repoOrRegistry === "repo" && req.body.repo.connected
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isIn(["github", "gitlab", "bitbucket"])
			.withMessage(t("Unsupported Git provider")),
		body("repo.connected")
			.if((value, { req }) => req.body.repoOrRegistry === "repo")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isBoolean()
			.withMessage(t("Not a valid boolean value"))
			.toBoolean(),
		body("repo.name")
			.if(
				(value, { req }) =>
					req.body.repoOrRegistry === "repo" && req.body.repo.connected
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty")),
		body("repo.url")
			.if(
				(value, { req }) =>
					req.body.repoOrRegistry === "repo" && req.body.repo.connected
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isURL({ require_tld: false, require_protocol: true })
			.withMessage(t("Invalid URL")),
		body("repo.branch")
			.if(
				(value, { req }) =>
					req.body.repoOrRegistry === "repo" && req.body.repo.connected
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty")),
		body("repo.path")
			.if(
				(value, { req }) =>
					req.body.repoOrRegistry === "repo" && req.body.repo.connected
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.custom((value) => value.startsWith("/"))
			.withMessage("Path must start with a '/' character")
			.bail()
			.matches(/^\/([\w\-\/]*)$/)
			.withMessage(
				"Not a valid path. Path names include alphanumeric characters, underscore, hyphens, and additional slashes."
			) // Remove trailing slashes using custom sanitizer
			.customSanitizer((value) => {
				if (value !== "/") return value.replace(/\/+$/, "");
				else return value;
			}),
		body("repo.dockerfile")
			.if(
				(value, { req }) =>
					req.body.repoOrRegistry === "repo" && req.body.repo.connected
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.matches(/^[\w\-\/]*$/)
			.withMessage(
				"Not a valid dockerfile path. Dockerfile path names include alphanumeric characters, underscore, hyphens, and additional slashes."
			) // Rem
			.customSanitizer((value) => {
				// Remove trailing slashes using custom sanitizer
				return value.replace(/\/+$/, "");
			}),
		body("repo.gitProviderId")
			.if(
				(value, { req }) =>
					req.body.repoOrRegistry === "repo" && req.body.repo.connected
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.custom(async (value, { req }) => {
				if (!helper.isValidId(value)) {
					throw new AgnostError(t("Invalid Git provider id"));
				}
				const gitProvider = await gitCtrl.getOneByQuery({
					_id: value,
				});
				if (!gitProvider) {
					throw new AgnostError(t("Git provider not found"));
				}

				if (gitProvider.accessToken)
					gitProvider.accessToken = helper.decryptText(gitProvider.accessToken);
				if (gitProvider.refreshToken)
					gitProvider.refreshToken = helper.decryptText(
						gitProvider.refreshToken
					);

				req.gitProvider = gitProvider;
				return true;
			}),
	];
};

export const checkVariables = (containerType, actionType) => {
	return [
		body("variables.*.name")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty")),
		body("variables.*.value").optional(),
	];
};

export const checkNetworking = (containerType, actionType) => {
	switch (actionType) {
		case "create":
			return [
				body("networking.containerPort")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.isInt({ min: 1, max: 65535 })
					.withMessage("Port must be an integer between 1 and 65535")
					.toInt(), // Converts the port number to an integer
			];
		case "update":
			return [
				body("networking.containerPort")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.isInt({ min: 1, max: 65535 })
					.withMessage("Port must be an integer between 1 and 65535")
					.toInt(), // Converts the port number to an integer
				body("networking.ingress.enabled")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.isBoolean()
					.withMessage(t("Not a valid boolean value"))
					.toBoolean(),
				body("networking.customDomain.enabled")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.isBoolean()
					.withMessage(t("Not a valid boolean value"))
					.toBoolean(),
				body("networking.customDomain.domain")
					.if(
						(value, { req }) =>
							req.body.networking.customDomain.enabled === true
					)
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.toLowerCase() // convert the value to lowercase
					.custom(async (value, { req }) => {
						// The below reges allows for wildcard subdomains
						// const dnameRegex = /^(?:\*\.)?(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
						// Check domain name syntax, we do not currently allow wildcard subdomains
						const dnameRegex = /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
						// Validate domain name (can be at mulitple levels)
						if (!dnameRegex.test(value)) {
							throw new AgnostError(t("Not a valid domain name '%s'", value));
						}

						// Check to see if this domain is already in the domain list
						const domain = await domainCtrl.getOneByQuery({
							domain: value,
						});

						if (domain) {
							throw new AgnostError(
								t(
									"The specified domain '%s' already exists in overall domains list",
									value
								)
							);
						}

						// Get the cluster object
						const cluster = await clsCtrl.getOneByQuery({
							clusterAccesssToken: process.env.CLUSTER_ACCESS_TOKEN,
						});

						if (cluster?.domains?.find((entry) => entry === value)) {
							throw new AgnostError(
								t(
									"The specified domain '%s' already exists in cluster custom domains list",
									value
								)
							);
						}

						const clusterIPs = await helper.getClusterIPs();
						for (let i = 0; i < clusterIPs.length; i++) {
							// Means that there is at least one IP address that is not private
							if (helper.isPrivateIP(clusterIPs[i]) === false) {
								return true;
							}
						}

						// This means all cluster IPs are private
						throw new AgnostError(
							t(
								"Your cluster IP addresses '%s' are private which are not routable on the internet. You cannot add a custom domain to an Agnost cluster with cluster IP addresses that are all private.",
								clusterIPs.join(", ")
							)
						);
					}),
				body("networking.tcpProxy.enabled")
					.if((value, { req }) =>
						["deployment", "stateful set"].includes(req.container.type)
					)
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.isBoolean()
					.withMessage(t("Not a valid boolean value"))
					.toBoolean(),
			];
		default:
			return [];
	}
};

function checkCPU(value, unit) {
	// First check if the value is a number
	if (isNaN(value)) {
		throw new AgnostError(t("CPU amount must be a number"));
	}

	if (unit === "millicores" || unit === "AverageValueMillicores") {
		const intValue = parseInt(value, 10);
		if (intValue.toString() !== value.toString()) {
			throw new AgnostError(
				"CPU amount must be an integer when using millicores"
			);
		}

		if (
			intValue < config.get("general.containers.minMillicores") ||
			intValue > config.get("general.containers.maxMillicores")
		) {
			throw new AgnostError(
				t(
					"CPU amount must be between %s and %s when using millicores",
					config.get("general.containers.minMillicores"),
					config.get("general.containers.maxMillicores")
				)
			);
		}
	} else if (unit === "cores" || unit === "AverageValueCores") {
		const floatVal = parseFloat(value);
		if (floatVal.toString() !== value.toString()) {
			throw new AgnostError("CPU amount must be a valid number");
		}

		if (
			floatVal < config.get("general.containers.minCPU") ||
			floatVal > config.get("general.containers.maxCPU")
		) {
			throw new AgnostError(
				t(
					"CPU request must be between %s and %s when using cores",
					config.get("general.containers.minCPU"),
					config.get("general.containers.maxCPU")
				)
			);
		}
	}

	return true;
}

function parseCpuValue(cpuValue, unit) {
	if (cpuValue && unit) {
		if (unit === "millicores") {
			return parseInt(cpuValue, 10); // Millicores
		}

		return parseFloat(cpuValue) * 1000; // Cores to Millicores
	}

	return undefined;
}

function checkMemory(value, unit) {
	// First check if the value is a number
	if (isNaN(value)) {
		throw new AgnostError(t("Memory amount must be a number"));
	}

	if (unit === "mebibyte" || unit === "AverageValueMebibyte") {
		const intValue = parseInt(value, 10);
		if (intValue.toString() !== value.toString()) {
			throw new AgnostError(
				"Memory amount must be an integer when using mebibytes"
			);
		}

		if (
			intValue < config.get("general.containers.minMiB") ||
			intValue > config.get("general.containers.maxMiB")
		) {
			throw new AgnostError(
				t(
					"Memory amount must be between %s and %s when using mebibytes",
					config.get("general.containers.minMiB"),
					config.get("general.containers.maxMiB")
				)
			);
		}
	} else if (unit === "gibibyte" || unit === "AverageValueGibibyte") {
		const floatVal = parseFloat(value);
		if (floatVal.toString() !== value.toString()) {
			throw new AgnostError("Memory amount must be a valid number");
		}

		if (
			floatVal < config.get("general.containers.minGiB") ||
			floatVal > config.get("general.containers.maxGiB")
		) {
			throw new AgnostError(
				t(
					"Memory request must be between %s and %s when using gibibytes",
					config.get("general.containers.minGiB"),
					config.get("general.containers.maxGiB")
				)
			);
		}
	}

	return true;
}

function parseMemoryValue(memoryValue, unit) {
	if (memoryValue && unit) {
		if (unit === "mebibyte") {
			return parseInt(memoryValue, 10); // Mebibytes
		}

		return parseFloat(memoryValue) * 1024; // Gibibytes to Mebibytes
	}

	return undefined;
}

function checkStorage(value, unit) {
	// First check if the value is a number
	if (isNaN(value)) {
		throw new AgnostError(t("Storage amount must be a number"));
	}

	if (unit === "mebibyte") {
		const intValue = parseInt(value, 10);
		if (intValue.toString() !== value.toString()) {
			throw new AgnostError(
				"Storage amount must be an integer when using mebibytes"
			);
		}

		if (
			intValue < config.get("general.containers.minStorageMiB") ||
			intValue > config.get("general.containers.maxStorageMiB")
		) {
			throw new AgnostError(
				t(
					"Storage amount must be between %s and %s when using mebibytes",
					config.get("general.containers.minStorageMiB"),
					config.get("general.containers.maxStorageMiB")
				)
			);
		}
	} else if (unit === "gibibyte") {
		const floatVal = parseFloat(value);
		if (floatVal.toString() !== value.toString()) {
			throw new AgnostError("Storage amount must be a valid number");
		}

		if (
			floatVal < config.get("general.containers.minStorageGiB") ||
			floatVal > config.get("general.containers.maxStorageGiB")
		) {
			throw new AgnostError(
				t(
					"Storage request must be between %s and %s when using gibibytes",
					config.get("general.containers.minStorageGiB"),
					config.get("general.containers.maxStorageGiB")
				)
			);
		}
	}

	return true;
}

export const checkPodConfig = (containerType, actionType) => {
	return [
		body("podConfig.restartPolicy")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isIn(
				containerType === "cron job"
					? ["OnFailure", "Never"]
					: ["Always", "OnFailure", "Never"]
			)
			.withMessage(t("Unsupported restart policy")),
		body("podConfig.cpuRequestType")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isIn(["millicores", "cores"])
			.withMessage(t("Unsupported CPU unit")),
		body("podConfig.cpuRequest")
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.if((value, { req }) =>
				["millicores", "cores"].includes(req.body.podConfig.cpuRequestType)
			)
			.custom((value, { req }) => {
				checkCPU(value, req.body.podConfig.cpuRequestType);
				const request = parseCpuValue(
					value,
					req.body.podConfig?.cpuRequestType
				);
				const limit = parseCpuValue(
					req.body.podConfig.cpuLimit,
					req.body.podConfig.cpuLimitType
				);

				if (request > limit) {
					throw new AgnostError("CPU request cannot be larger than CPU limit");
				}

				return true;
			})
			.bail()
			.customSanitizer((value) => {
				// Check if the number has a decimal to decide on int or float conversion
				return value.includes(".") ? parseFloat(value) : parseInt(value, 10);
			}),
		body("podConfig.cpuLimitType")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isIn(["millicores", "cores"])
			.withMessage(t("Unsupported CPU unit")),
		body("podConfig.cpuLimit")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.if((value, { req }) =>
				["millicores", "cores"].includes(req.body.podConfig.cpuLimitType)
			)
			.custom((value, { req }) => {
				checkCPU(value, req.body.podConfig?.cpuLimitType);

				const request = parseCpuValue(
					req.body.podConfig.cpuRequest,
					req.body.podConfig.cpuRequestType
				);
				const limit = parseCpuValue(value, req.body.podConfig.cpuLimitType);

				if (request > limit) {
					throw new AgnostError("CPU limit cannot be smaller than CPU request");
				}

				return true;
			})
			.bail()
			.customSanitizer((value) => {
				// Check if the number has a decimal to decide on int or float conversion
				return value.includes(".") ? parseFloat(value) : parseInt(value, 10);
			}),
		body("podConfig.memoryRequestType")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isIn(["mebibyte", "gibibyte"])
			.withMessage(t("Unsupported memory unit")),
		body("podConfig.memoryRequest")
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.if((value, { req }) =>
				["mebibyte", "gibibyte"].includes(req.body.podConfig.memoryRequestType)
			)
			.custom((value, { req }) => {
				checkMemory(value, req.body.podConfig.memoryRequestType);

				const request = parseMemoryValue(
					value,
					req.body.podConfig.memoryRequestType
				);
				const limit = parseMemoryValue(
					req.body.podConfig.memoryLimit,
					req.body.podConfig.memoryLimitType
				);

				if (request > limit) {
					throw new AgnostError(
						"Memory request cannot be larger than memory limit"
					);
				}

				return true;
			})
			.bail()
			.customSanitizer((value) => {
				// Check if the number has a decimal to decide on int or float conversion
				return value.includes(".") ? parseFloat(value) : parseInt(value, 10);
			}),
		body("podConfig.memoryLimitType")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isIn(["mebibyte", "gibibyte"])
			.withMessage(t("Unsupported memory unit")),
		body("podConfig.memoryLimit")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.if((value, { req }) =>
				["mebibyte", "gibibyte"].includes(req.body.podConfig.memoryLimitType)
			)
			.custom((value, { req }) => {
				checkMemory(value, req.body.podConfig.memoryLimitType);

				const request = parseMemoryValue(
					req.body.podConfig.memoryRequest,
					req.body.podConfig.memoryRequestType
				);
				const limit = parseMemoryValue(
					value,
					req.body.podConfig.memoryLimitType
				);

				if (request > limit) {
					throw new AgnostError(
						"Memory limit cannot be smaller than memory request"
					);
				}

				return true;
			})
			.bail()
			.customSanitizer((value) => {
				// Check if the number has a decimal to decide on int or float conversion
				return value.includes(".") ? parseFloat(value) : parseInt(value, 10);
			}),
	];
};

export const checkStorageConfig = (containerType, actionType) => {
	return [
		body("storageConfig.enabled")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isBoolean()
			.withMessage(t("Not a valid boolean value"))
			.toBoolean(),
		body("storageConfig.mountPath")
			.if((value, { req }) => req.body.storageConfig.enabled === true)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.custom((value) => value.startsWith("/"))
			.withMessage("Path must start with a '/' character")
			.bail()
			.matches(/^\/([\w\-\/]*)$/)
			.withMessage(
				"Not a valid mount path. Mount paths include alphanumeric characters, underscore, hyphens, and additional slashes."
			) // Remove trailing slashes using custom sanitizer
			.customSanitizer((value) => value.replace(/\/+$/, "")),
		body("storageConfig.accessModes")
			.if(
				(value, { req }) =>
					req.body.storageConfig.enabled === true &&
					req.container.storageConfig.enabled === false
			)
			.isArray()
			.withMessage(t("Access modes need to be an array of strings"))
			.custom((value) => {
				if (value.length === 0) {
					throw new AgnostError(
						t("At least one access mode needs to be specified.")
					);
				}

				return true;
			}),
		body("storageConfig.accessModes.*")
			.if(
				(value, { req }) =>
					req.body.storageConfig.enabled === true &&
					req.container.storageConfig.enabled === false
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isIn(["ReadWriteOnce", "ReadOnlyMany", "ReadWriteMany"])
			.withMessage(t("Unsupported storage access mode")),
		body("storageConfig.sizeType")
			.if((value, { req }) => req.body.storageConfig.enabled === true)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isIn(["mebibyte", "gibibyte"])
			.withMessage(t("Unsupported storage size unit"))
			.bail()
			.if(
				(value, { req }) =>
					actionType === "update" && req.container.storageConfig.size > 0
			)
			.custom((value, { req }) => {
				const existingSize = req.container.storageConfig.size;
				const existingSizeType = req.container.storageConfig.sizeType;
				const existingSizeInMiB =
					existingSizeType === "mebibyte"
						? existingSize
						: Math.round(existingSize * 1024);
				// Calculate size in mebibytes
				const newSize = req.body.storageConfig.size;
				const newSizeType = req.body.storageConfig.sizeType;
				const newSizeInMiB =
					newSizeType === "mebibyte" ? newSize : Math.round(newSize * 1024);

				// When we disable storage we do not reset the size value for this reason we make this check only if storage is enabled already
				if (
					newSizeInMiB < existingSizeInMiB &&
					req.container.storageConfig.enabled === true
				) {
					throw new AgnostError(
						t(
							"Storage size cannot be decreased. Current size is %s %s",
							existingSize,
							existingSizeType
						)
					);
				}

				return true;
			}),
		body("storageConfig.size")
			.if((value, { req }) => req.body.storageConfig.enabled === true)
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.if((value, { req }) =>
				["mebibyte", "gibibyte"].includes(req.body.storageConfig.sizeType)
			)
			.custom((value, { req }) => {
				checkStorage(value, req.body.storageConfig.sizeType);

				return true;
			})
			.bail()
			.customSanitizer((value) => {
				// Check if the number has a decimal to decide on int or float conversion
				return value.includes(".") ? parseFloat(value) : parseInt(value, 10);
			}),
	];
};

export const checkDeploymentConfig = (containerType, actionType) => {
	return [
		body("deploymentConfig.desiredReplicas")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({ min: 1, max: 100 })
			.withMessage("Desired replicas must be an integer between 1 and 100")
			.toInt(), // Converts the replica number to an integer
		body("deploymentConfig.minReplicas")
			.if(
				(value, { req }) =>
					req.body.deploymentConfig.cpuMetric.enabled === true ||
					req.body.deploymentConfig.memoryMetric.enabled === true
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({ min: 1, max: 100 })
			.withMessage("Min replicas must be an integer between 1 and 100")
			.toInt() // Converts the replica number to an integer
			.custom((value, { req }) => {
				const minReplicas = parseInt(value, 10);
				const maxReplicas = parseInt(req.body.deploymentConfig.maxReplicas, 10);

				if (maxReplicas < minReplicas) {
					throw new AgnostError(
						"Min replicas cannot be larger than max replicas"
					);
				}

				return true;
			}),
		body("deploymentConfig.maxReplicas")
			.if(
				(value, { req }) =>
					req.body.deploymentConfig.cpuMetric.enabled === true ||
					req.body.deploymentConfig.memoryMetric.enabled === true
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({ min: 1, max: 100 })
			.withMessage("Max replicas must be an integer between 1 and 100")
			.toInt() // Converts the replica number to an integer
			.custom((value, { req }) => {
				const minReplicas = parseInt(req.body.deploymentConfig.minReplicas, 10);
				const maxReplicas = parseInt(value, 10);

				if (maxReplicas < minReplicas) {
					throw new AgnostError(
						"Max replicas cannot be smaller than min replicas"
					);
				}

				return true;
			}),
		body("deploymentConfig.cpuMetric.enabled")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isBoolean()
			.withMessage(t("Not a valid boolean value"))
			.toBoolean(),
		body("deploymentConfig.cpuMetric.metricType")
			.if(
				(value, { req }) => req.body.deploymentConfig.cpuMetric.enabled === true
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isIn([
				"AverageUtilization",
				"AverageValueMillicores",
				"AverageValueCores",
			])
			.withMessage(t("Unsupported CPU metric type")),
		body("deploymentConfig.cpuMetric.metricValue")
			.if(
				(value, { req }) => req.body.deploymentConfig.cpuMetric.enabled === true
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.custom((value, { req }) => {
				if (
					["AverageValueMillicores", "AverageValueCores"].includes(
						req.body.deploymentConfig.cpuMetric.metricType
					)
				) {
					checkCPU(value, req.body.deploymentConfig.cpuMetric.metricType);
				} else if (
					req.body.deploymentConfig.cpuMetric.metricType ===
					"AverageUtilization"
				) {
					if (isNaN(value)) {
						throw new AgnostError(t("CPU metric value must be a number"));
					}

					if (parseInt(value, 10) < 1 || parseInt(value, 10) > 100) {
						throw new AgnostError(
							t("CPU metric value must be between %s and %s", 1, 100)
						);
					}
				}

				return true;
			})
			.bail()
			.customSanitizer((value) => {
				// Check if the number has a decimal to decide on int or float conversion
				return value.includes(".") ? parseFloat(value) : parseInt(value, 10);
			}),
		body("deploymentConfig.memoryMetric.enabled")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isBoolean()
			.withMessage(t("Not a valid boolean value"))
			.toBoolean(),
		body("deploymentConfig.memoryMetric.metricType")
			.if(
				(value, { req }) =>
					req.body.deploymentConfig.memoryMetric.enabled === true
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isIn(["AverageValueMebibyte", "AverageValueGibibyte"])
			.withMessage(t("Unsupported memory metric type")),
		body("deploymentConfig.memoryMetric.metricValue")
			.if(
				(value, { req }) =>
					req.body.deploymentConfig.memoryMetric.enabled === true
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.custom((value, { req }) => {
				if (
					["AverageValueMebibyte", "AverageValueGibibyte"].includes(
						req.body.deploymentConfig.memoryMetric.metricType
					)
				) {
					checkMemory(value, req.body.deploymentConfig.memoryMetric.metricType);
				}

				return true;
			})
			.bail()
			.customSanitizer((value) => {
				// Check if the number has a decimal to decide on int or float conversion
				return value.includes(".") ? parseFloat(value) : parseInt(value, 10);
			}),
	];
};

export const checkProbes = (containerType, actionType) => {
	return [
		body("probes.startup.enabled")
			.if((value, { req }) =>
				["deployment", "stateful set"].includes(req.container.type)
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isBoolean()
			.withMessage(t("Not a valid boolean value"))
			.toBoolean(),
		body("probes.startup.checkMechanism")
			.if(
				(value, { req }) =>
					req.body.probes.startup.enabled === true &&
					["deployment", "stateful set"].includes(req.container.type)
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isIn(["exec", "httpGet", "tcpSocket"])
			.withMessage(t("Unsupported startup probe check mechanism type")),
		body("probes.startup.initialDelaySeconds")
			.if(
				(value, { req }) =>
					req.body.probes.startup.enabled === true &&
					["deployment", "stateful set"].includes(req.container.type)
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({ min: 1, max: 3600 })
			.withMessage(
				"Initial delay seconds need to be an integer between 1 and 600"
			)
			.toInt(),
		body("probes.startup.periodSeconds")
			.if(
				(value, { req }) =>
					req.body.probes.startup.enabled === true &&
					["deployment", "stateful set"].includes(req.container.type)
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({ min: 1, max: 3600 })
			.withMessage("Period seconds need to be an integer between 1 and 600")
			.toInt(),
		body("probes.startup.timeoutSeconds")
			.if(
				(value, { req }) =>
					req.body.probes.startup.enabled === true &&
					["deployment", "stateful set"].includes(req.container.type)
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({ min: 1, max: 3600 })
			.withMessage("Timeout seconds need to be an integer between 1 and 600")
			.toInt(),
		body("probes.startup.failureThreshold")
			.if(
				(value, { req }) =>
					req.body.probes.startup.enabled === true &&
					["deployment", "stateful set"].includes(req.container.type)
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({ min: 1, max: 20 })
			.withMessage("Failure threshold need to be an integer between 1 and 20")
			.toInt(),
		body("probes.startup.execCommand")
			.if(
				(value, { req }) =>
					req.body.probes.startup.enabled === true &&
					["deployment", "stateful set"].includes(req.container.type) &&
					req.body.probes.startup.checkMechanism === "exec"
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty")),
		body("probes.startup.tcpPort")
			.if(
				(value, { req }) =>
					req.body.probes.startup.enabled === true &&
					["deployment", "stateful set"].includes(req.container.type) &&
					req.body.probes.startup.checkMechanism === "tcpSocket"
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({ min: 1, max: 65535 })
			.withMessage("Port must be an integer between 1 and 65535")
			.toInt(), // Converts the port number to an integer
		body("probes.startup.httpPath")
			.if(
				(value, { req }) =>
					req.body.probes.startup.enabled === true &&
					["deployment", "stateful set"].includes(req.container.type) &&
					req.body.probes.startup.checkMechanism === "httpGet"
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.custom((value) => value.startsWith("/"))
			.withMessage("Path must start with a '/' character")
			.bail()
			.matches(/^\/([\w\-\/]*)$/)
			.withMessage(
				"Not a valid path. Path names include alphanumeric characters, underscore, hyphens, and additional slashes."
			) // Remove trailing slashes using custom sanitizer
			.customSanitizer((value) => value.replace(/\/+$/, "")),
		body("probes.startup.httpPort")
			.if(
				(value, { req }) =>
					req.body.probes.startup.enabled === true &&
					["deployment", "stateful set"].includes(req.container.type) &&
					req.body.probes.startup.checkMechanism === "httpGet"
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({ min: 1, max: 65535 })
			.withMessage("Port must be an integer between 1 and 65535")
			.toInt(), // Converts the port number to an integer
		body("probes.readiness.enabled")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isBoolean()
			.withMessage(t("Not a valid boolean value"))
			.toBoolean(),
		body("probes.readiness.checkMechanism")
			.if((value, { req }) => req.body.probes.startup.enabled === true)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isIn(["exec", "httpGet", "tcpSocket"])
			.withMessage(t("Unsupported readiness probe check mechanism type")),
		body("probes.readiness.initialDelaySeconds")
			.if((value, { req }) => req.body.probes.startup.enabled === true)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({ min: 1, max: 3600 })
			.withMessage(
				"Initial delay seconds need to be an integer between 1 and 600"
			)
			.toInt(),
		body("probes.readiness.periodSeconds")
			.if((value, { req }) => req.body.probes.startup.enabled === true)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({ min: 1, max: 3600 })
			.withMessage("Period seconds need to be an integer between 1 and 600")
			.toInt(),
		body("probes.readiness.timeoutSeconds")
			.if((value, { req }) => req.body.probes.startup.enabled === true)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({ min: 1, max: 3600 })
			.withMessage("Timeout seconds need to be an integer between 1 and 600")
			.toInt(),
		body("probes.readiness.failureThreshold")
			.if((value, { req }) => req.body.probes.startup.enabled === true)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({ min: 1, max: 20 })
			.withMessage("Failure threshold need to be an integer between 1 and 20")
			.toInt(),
		body("probes.readiness.execCommand")
			.if(
				(value, { req }) =>
					req.body.probes.readiness.enabled === true &&
					req.body.probes.readiness.checkMechanism === "exec"
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty")),
		body("probes.readiness.tcpPort")
			.if(
				(value, { req }) =>
					req.body.probes.readiness.enabled === true &&
					req.body.probes.readiness.checkMechanism === "tcpSocket"
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({ min: 1, max: 65535 })
			.withMessage("Port must be an integer between 1 and 65535")
			.toInt(), // Converts the port number to an integer
		body("probes.readiness.httpPath")
			.if(
				(value, { req }) =>
					req.body.probes.readiness.enabled === true &&
					req.body.probes.readiness.checkMechanism === "httpGet"
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.custom((value) => value.startsWith("/"))
			.withMessage("Path must start with a '/' character")
			.bail()
			.matches(/^\/([\w\-\/]*)$/)
			.withMessage(
				"Not a valid path. Path names include alphanumeric characters, underscore, hyphens, and additional slashes."
			) // Remove trailing slashes using custom sanitizer
			.customSanitizer((value) => value.replace(/\/+$/, "")),
		body("probes.readiness.httpPort")
			.if(
				(value, { req }) =>
					req.body.probes.readiness.enabled === true &&
					req.body.probes.readiness.checkMechanism === "httpGet"
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({ min: 1, max: 65535 })
			.withMessage("Port must be an integer between 1 and 65535")
			.toInt(), // Converts the port number to an integer
		body("probes.liveness.enabled")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isBoolean()
			.withMessage(t("Not a valid boolean value"))
			.toBoolean(),
		body("probes.liveness.checkMechanism")
			.if((value, { req }) => req.body.probes.startup.enabled === true)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isIn(["exec", "httpGet", "tcpSocket"])
			.withMessage(t("Unsupported liveness probe check mechanism type")),
		body("probes.liveness.initialDelaySeconds")
			.if((value, { req }) => req.body.probes.startup.enabled === true)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({ min: 1, max: 3600 })
			.withMessage(
				"Initial delay seconds need to be an integer between 1 and 600"
			)
			.toInt(),
		body("probes.liveness.periodSeconds")
			.if((value, { req }) => req.body.probes.startup.enabled === true)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({ min: 1, max: 3600 })
			.withMessage("Period seconds need to be an integer between 1 and 600")
			.toInt(),
		body("probes.liveness.timeoutSeconds")
			.if((value, { req }) => req.body.probes.startup.enabled === true)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({ min: 1, max: 3600 })
			.withMessage("Timeout seconds need to be an integer between 1 and 600")
			.toInt(),
		body("probes.liveness.failureThreshold")
			.if((value, { req }) => req.body.probes.startup.enabled === true)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({ min: 1, max: 20 })
			.withMessage("Failure threshold need to be an integer between 1 and 20")
			.toInt(),
		body("probes.liveness.execCommand")
			.if(
				(value, { req }) =>
					req.body.probes.liveness.enabled === true &&
					req.body.probes.liveness.checkMechanism === "exec"
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty")),
		body("probes.liveness.tcpPort")
			.if(
				(value, { req }) =>
					req.body.probes.liveness.enabled === true &&
					req.body.probes.liveness.checkMechanism === "tcpSocket"
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({ min: 1, max: 65535 })
			.withMessage("Port must be an integer between 1 and 65535")
			.toInt(), // Converts the port number to an integer
		body("probes.liveness.httpPath")
			.if(
				(value, { req }) =>
					req.body.probes.liveness.enabled === true &&
					req.body.probes.liveness.checkMechanism === "httpGet"
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.custom((value) => value.startsWith("/"))
			.withMessage("Path must start with a '/' character")
			.bail()
			.matches(/^\/([\w\-\/]*)$/)
			.withMessage(
				"Not a valid path. Path names include alphanumeric characters, underscore, hyphens, and additional slashes."
			) // Remove trailing slashes using custom sanitizer
			.customSanitizer((value) => value.replace(/\/+$/, "")),
		body("probes.liveness.httpPort")
			.if(
				(value, { req }) =>
					req.body.probes.liveness.enabled === true &&
					req.body.probes.liveness.checkMechanism === "httpGet"
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({ min: 1, max: 65535 })
			.withMessage("Port must be an integer between 1 and 65535")
			.toInt(), // Converts the port number to an integer
	];
};

export const checkStatefulSetConfig = (containerType, actionType) => {
	return [
		body("statefulSetConfig.desiredReplicas")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({ min: 1, max: 100 })
			.withMessage("Desired replicas must be an integer between 1 and 10")
			.toInt(), // Converts the replica number to an integer
		body("statefulSetConfig.persistentVolumeClaimRetentionPolicy.whenDeleted")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isIn(["Retain", "Delete"])
			.withMessage(t("Unsupported storage retention policy")),
		body("statefulSetConfig.persistentVolumeClaimRetentionPolicy.whenScaled")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isIn(["Retain", "Delete"])
			.withMessage(t("Unsupported storage retention policy")),
	];
};

export const checkCronJobConfig = (containerType, actionType) => {
	return [
		body("cronJobConfig.schedule")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.custom((value) => {
				try {
					parser.parseExpression(value);
					return true;
				} catch (err) {
					throw new AgnostError(
						t("Not a valid cron expression. %s", err.message)
					);
				}
			}),
		body("cronJobConfig.timeZone")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isIn(timezones.map((entry) => entry.value))
			.withMessage(t("Unsupported timezone")),
		body("cronJobConfig.concurrencyPolicy")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isIn(["Allow", "Forbid", "Replace"])
			.withMessage(t("Unsupported coucurrency policy")),
		body("cronJobConfig.suspend")
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isBoolean()
			.withMessage(t("Not a valid boolean value"))
			.toBoolean(),
	];
};
