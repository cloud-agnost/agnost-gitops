import config from "config";
import { body } from "express-validator";
import parser from "cron-parser";
import cntrCtrl from "../../controllers/container.js";
import domainCtrl from "../../controllers/domain.js";
import gitCtrl from "../../controllers/gitProvider.js";
import regCtrl from "../../controllers/registry.js";
import { timezones } from "../../config/timezones.js";
import helper from "../../util/helper.js";
import { getClusterRecord } from "../../handlers/util.js";
import { providerTypes } from "../../config/constants.js";

export const checkName = (containerType, actionType) => {
	return [
		body("name")
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isLength({
				min: config.get("general.minNameLength"),
				max: config.get("general.maxTextLength"),
			})
			.withMessage(
				`Name must be minimum ${config.get(
					"general.minNameLength"
				)} and maximum ${config.get("general.maxTextLength")} characters long`
			)
			.bail()
			.matches(
				/^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/
			)
			.withMessage(
				"Container name can only contain lowercase alphanumeric characters, hyphens and dots, and cannot start or end with a hyphen or dot"
			)
			.bail()
			.custom(async (value, { req }) => {
				let containers = await cntrCtrl.getManyByQuery({
					environmentId: req.environment._id,
				});
				containers.forEach((container) => {
					if (
						(container.name.toLowerCase() === value.toLowerCase() ||
							container.iid === value.toLowerCase()) &&
						actionType === "create"
					)
						throw new Error(
							`A container with the provided name or internal identifier already exists`
						);

					if (
						(container.name.toLowerCase() === value.toLowerCase() ||
							container.iid === value.toLowerCase()) &&
						actionType === "update" &&
						req.container._id.toString() !== container._id.toString()
					)
						throw new Error(
							`A container with the provided name or internal identifier already exists`
						);
				});

				return true;
			}),
	];
};

export const checkRepoOrRegistry = (containerType) => {
	return [
		body("repoOrRegistry")
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isIn(["repo", "registry"])
			.withMessage(`Unsupported ${containerType} source type`)
			.bail()
			.if((value) => value === "repo")
			.custom(async (value, { req }) => {
				const cluster = await getClusterRecord();
				if (cluster.domains?.length === 0 && !cluster.reverseProxyURL) {
					throw new Error(
						`You have neither set your cluster's domain nor the reverse proxy URL. A repository source can only be assigned if the cluster domain or reverse proxy URL has been set.`
					);
				}
				return true;
			}),
	];
};

export const checkRegistry = () => {
	return [
		body("registry.registryId")
			.if((value, { req }) => req.body.repoOrRegistry === "registry")
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.custom(async (value, { req }) => {
				if (!helper.isValidId(value)) {
					throw new Error("Invalid registry id");
				}

				const registry = await regCtrl.getOneById(value);
				if (!registry) {
					throw new Error("Registry record not found");
				}

				req.registry = registry;
				return true;
			}),
		body("registry.imageName")
			.if(
				(value, { req }) =>
					req.body.repoOrRegistry === "registry" && !req.body.registry.imageUrl
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty"),
		body("registry.imageTag")
			.if(
				(value, { req }) =>
					req.body.repoOrRegistry === "registry" && !req.body.registry.imageUrl
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty"),
		body("registry.imageUrl")
			.if(
				(value, { req }) =>
					req.body.repoOrRegistry === "registry" &&
					!req.body.registry.imageName &&
					!req.body.registry.imageTag
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty"),
	];
};

export const checkRepo = () => {
	return [
		body("repo.type")
			.if(
				(value, { req }) =>
					req.body.repoOrRegistry === "repo" && req.body.repo.connected
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isIn(providerTypes)
			.withMessage("Unsupported Git provider"),
		body("repo.connected")
			.if((value, { req }) => req.body.repoOrRegistry === "repo")
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isBoolean()
			.withMessage("Not a valid boolean value")
			.toBoolean(),
		body("repo.name")
			.if(
				(value, { req }) =>
					req.body.repoOrRegistry === "repo" && req.body.repo.connected
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty"),
		body("repo.url")
			.if(
				(value, { req }) =>
					req.body.repoOrRegistry === "repo" && req.body.repo.connected
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isURL({ require_tld: false, require_protocol: true })
			.withMessage("Invalid URL"),
		body("repo.branch")
			.if(
				(value, { req }) =>
					req.body.repoOrRegistry === "repo" && req.body.repo.connected
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty"),
		body("repo.path")
			.if(
				(value, { req }) =>
					req.body.repoOrRegistry === "repo" && req.body.repo.connected
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.matches(/^(\/([A-Za-z0-9-_+.]+\/)*([A-Za-z0-9-_+.]+\/?)?)?$/)
			.withMessage(
				'Not a valid path. Paths start with "/" and contain only alphanumeric characters, dots (.), underscores (_), hyphens (-), slashes (/).'
			) // Remove trailing slashes using custom sanitizer
			.customSanitizer((value) => {
				if (value !== "/") value = value.replace(/\/+$/, "");
				if (!value.startsWith("/")) value = `/${value}`;
				return value;
			}),
		// Dockerfile is relative to the repo path
		body("repo.dockerfile")
			.if(
				(value, { req }) =>
					req.body.repoOrRegistry === "repo" && req.body.repo.connected
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.matches(/^([A-Za-z0-9-_+.]+\/)*([A-Za-z0-9-_+.]+\/?)?$/)
			.withMessage(
				"Not a valid file path. Dockerfile faths contain only alphanumeric characters, dots (.), underscores (_), hyphens (-), slashes (/)."
			) // Remove trailing slashes using custom sanitizer
			.customSanitizer((value) => {
				if (value !== "/") value = value.replace(/\/+$/, "");
				return value;
			}),
		body("repo.gitProviderId")
			.if(
				(value, { req }) =>
					(req.body.repoOrRegistry === "repo" && req.body.repo.connected) ||
					(req.body.repoOrRegistry === "repo" &&
						!req.body.repo.connected &&
						req.container.repo.connected)
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.custom(async (value, { req }) => {
				if (!helper.isValidId(value)) {
					throw new Error("Invalid Git provider id");
				}

				const gitProvider = await gitCtrl.getOneByQuery({
					_id: value,
				});
				if (!gitProvider) {
					throw new Error("Git provider not found");
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
		body("repo.repoId")
			.if(
				(value, { req }) =>
					req.body.repoOrRegistry === "repo" &&
					req.body.repo.connected &&
					req.body.repo.type === "gitlab"
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty"),
	];
};

export const checkVariables = () => {
	return [
		body("variables.*.name")
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty"),
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
					.withMessage("Required field, cannot be left empty")
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
					.withMessage("Required field, cannot be left empty")
					.bail()
					.isInt({ min: 1, max: 65535 })
					.withMessage("Port must be an integer between 1 and 65535")
					.toInt(), // Converts the port number to an integer
				body("networking.ingress.enabled")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.isBoolean()
					.withMessage("Not a valid boolean value")
					.bail()
					.custom(async (value) => {
						const cluster = await getClusterRecord();
						if (value && cluster.domains?.length === 0) {
							throw new Error(
								`You have not set the domain of your cluster yet. Subdomain based ingress for a container can only be activated after the cluster domain has been set.`
							);
						}
						return true;
					})
					.toBoolean(),
				body("networking.ingress.type")
					.if((value, { req }) => req.body.networking.ingress.enabled === true)
					.trim()
					.toLowerCase() // convert the value to lowercase
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.isIn(["subdomain"]) // We only allow subdomain based ingress for now
					.withMessage("Unsupported ingress type"),
				body("networking.customDomain.enabled")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.isBoolean()
					.withMessage("Not a valid boolean value")
					.bail()
					.custom(async (value) => {
						const cluster = await getClusterRecord();
						if (value && cluster.domains?.length === 0) {
							throw new Error(
								`You have not set the domain of your cluster yet. Custom domains can only be created after the cluster domain has been set.`
							);
						}
						return true;
					})
					.toBoolean(),
				body("networking.customDomain.domain")
					.if(
						(value, { req }) =>
							req.body.networking.customDomain.enabled === true
					)
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.toLowerCase() // convert the value to lowercase
					.custom(async (value) => {
						// Check domain name syntax, the below reges allows for wildcard subdomains
						const dnameRegex = /^(?:\*\.)?(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
						// Validate domain name (can be at mulitple levels)
						if (!dnameRegex.test(value)) {
							throw new Error(`Not a valid domain name '${value}'`);
						}

						// Check to see if this domain is already in the domain list
						const domain = await domainCtrl.getOneByQuery({
							domain: value,
						});

						if (domain) {
							throw new Error(
								`The specified domain '${value}' already exists in overall domains list`
							);
						}

						return true;
					}),
				body("networking.tcpProxy.enabled")
					.if((value, { req }) =>
						["deployment", "statefulset"].includes(req.container.type)
					)
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.isBoolean()
					.withMessage("Not a valid boolean value")
					.toBoolean(),
			];
		default:
			return [];
	}
};

function checkCPU(value, unit) {
	// First check if the value is a number
	if (isNaN(value)) {
		throw new Error("CPU amount must be a number");
	}

	if (unit === "millicores" || unit === "AverageValueMillicores") {
		const intValue = parseInt(value, 10);
		if (intValue.toString() !== value.toString()) {
			throw new Error("CPU amount must be an integer when using millicores");
		}

		if (
			intValue < config.get("general.containers.minMillicores") ||
			intValue > config.get("general.containers.maxMillicores")
		) {
			throw new Error(
				`CPU amount must be between ${config.get(
					"general.containers.minMillicores"
				)} and ${config.get(
					"general.containers.maxMillicores"
				)} when using millicores`
			);
		}
	} else if (unit === "cores" || unit === "AverageValueCores") {
		const floatVal = parseFloat(value);
		if (floatVal.toString() !== value.toString()) {
			throw new Error("CPU amount must be a valid number");
		}

		if (
			floatVal < config.get("general.containers.minCPU") ||
			floatVal > config.get("general.containers.maxCPU")
		) {
			throw new Error(
				`CPU request must be between ${config.get(
					"general.containers.minCPU"
				)} and ${config.get("general.containers.maxCPU")} when using cores`
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
		throw new Error("Memory amount must be a number");
	}

	if (unit === "mebibyte" || unit === "AverageValueMebibyte") {
		const intValue = parseInt(value, 10);
		if (intValue.toString() !== value.toString()) {
			throw new Error("Memory amount must be an integer when using mebibytes");
		}

		if (
			intValue < config.get("general.containers.minMiB") ||
			intValue > config.get("general.containers.maxMiB")
		) {
			throw new Error(
				`Memory amount must be between ${config.get(
					"general.containers.minMiB"
				)} and ${config.get("general.containers.maxMiB")} when using mebibytes`
			);
		}
	} else if (unit === "gibibyte" || unit === "AverageValueGibibyte") {
		const floatVal = parseFloat(value);
		if (floatVal.toString() !== value.toString()) {
			throw new Error("Memory amount must be a valid number");
		}

		if (
			floatVal < config.get("general.containers.minGiB") ||
			floatVal > config.get("general.containers.maxGiB")
		) {
			throw new Error(
				`Memory request must be between ${config.get(
					"general.containers.minGiB"
				)} and ${config.get("general.containers.maxGiB")} when using gibibytes`
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
		throw new Error("Storage amount must be a number");
	}

	if (unit === "mebibyte") {
		const intValue = parseInt(value, 10);
		if (intValue.toString() !== value.toString()) {
			throw new Error("Storage amount must be an integer when using mebibytes");
		}

		if (
			intValue < config.get("general.containers.minStorageMiB") ||
			intValue > config.get("general.containers.maxStorageMiB")
		) {
			throw new Error(
				`Storage amount must be between ${config.get(
					"general.containers.minStorageMiB"
				)} and ${config.get(
					"general.containers.maxStorageMiB"
				)} when using mebibytes`
			);
		}
	} else if (unit === "gibibyte") {
		const floatVal = parseFloat(value);
		if (floatVal.toString() !== value.toString()) {
			throw new Error("Storage amount must be a valid number");
		}

		if (
			floatVal < config.get("general.containers.minStorageGiB") ||
			floatVal > config.get("general.containers.maxStorageGiB")
		) {
			throw new Error(
				`Storage request must be between ${config.get(
					"general.containers.minStorageGiB"
				)} and ${config.get(
					"general.containers.maxStorageGiB"
				)} when using gibibytes`
			);
		}
	}

	return true;
}

export const checkPodConfig = (containerType) => {
	return [
		body("podConfig.restartPolicy")
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isIn(
				containerType === "cronjob"
					? ["OnFailure", "Never"]
					: ["Always", "OnFailure", "Never"]
			)
			.withMessage("Unsupported restart policy"),
		body("podConfig.cpuRequestType")
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isIn(["millicores", "cores"])
			.withMessage("Unsupported CPU unit"),
		body("podConfig.cpuRequest")
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
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
					throw new Error("CPU request cannot be larger than CPU limit");
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
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isIn(["millicores", "cores"])
			.withMessage("Unsupported CPU unit"),
		body("podConfig.cpuLimit")
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
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
					throw new Error("CPU limit cannot be smaller than CPU request");
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
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isIn(["mebibyte", "gibibyte"])
			.withMessage("Unsupported memory unit"),
		body("podConfig.memoryRequest")
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
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
					throw new Error("Memory request cannot be larger than memory limit");
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
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isIn(["mebibyte", "gibibyte"])
			.withMessage("Unsupported memory unit"),
		body("podConfig.memoryLimit")
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
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
					throw new Error("Memory limit cannot be smaller than memory request");
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
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isBoolean()
			.withMessage("Not a valid boolean value")
			.toBoolean(),
		body("storageConfig.mountPath")
			.if((value, { req }) => req.body.storageConfig.enabled === true)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.custom((value) => value.startsWith("/"))
			.withMessage("Path must start with a '/' character")
			.bail()
			.matches(/^(\/([A-Za-z0-9-_+.]+\/)*([A-Za-z0-9-_+.]+\/?)?)?$/)
			.withMessage(
				'Not a valid mount path. Paths start with "/" and contain only alphanumeric characters, dots (.), underscores (_), hyphens (-), slashes (/).'
			) // Remove trailing slashes using custom sanitizer
			.customSanitizer((value) => {
				if (value !== "/") value = value.replace(/\/+$/, "");
				if (!value.startsWith("/")) value = `/${value}`;
				return value;
			}),
		body("storageConfig.accessModes")
			.if(
				(value, { req }) =>
					req.body.storageConfig.enabled === true &&
					req.container.storageConfig.enabled === false
			)
			.isArray()
			.withMessage("Access modes need to be an array of strings")
			.custom((value) => {
				if (value.length === 0) {
					throw new Error("At least one access mode needs to be specified.");
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
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isIn(["ReadWriteOnce", "ReadOnlyMany", "ReadWriteMany"])
			.withMessage("Unsupported storage access mode"),
		body("storageConfig.sizeType")
			.if((value, { req }) => req.body.storageConfig.enabled === true)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isIn(["mebibyte", "gibibyte"])
			.withMessage("Unsupported storage size unit")
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
					throw new Error(
						`Storage size cannot be decreased. Current size is ${existingSize} ${existingSizeType}"`
					);
				}

				return true;
			}),
		body("storageConfig.size")
			.if((value, { req }) => req.body.storageConfig.enabled === true)
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
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

export const checkDeploymentConfig = () => {
	return [
		body("deploymentConfig.desiredReplicas")
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
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
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isInt({ min: 1, max: 100 })
			.withMessage("Min replicas must be an integer between 1 and 100")
			.toInt() // Converts the replica number to an integer
			.custom((value, { req }) => {
				const minReplicas = parseInt(value, 10);
				const maxReplicas = parseInt(req.body.deploymentConfig.maxReplicas, 10);

				if (maxReplicas < minReplicas) {
					throw new Error("Min replicas cannot be larger than max replicas");
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
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isInt({ min: 1, max: 100 })
			.withMessage("Max replicas must be an integer between 1 and 100")
			.toInt() // Converts the replica number to an integer
			.custom((value, { req }) => {
				const minReplicas = parseInt(req.body.deploymentConfig.minReplicas, 10);
				const maxReplicas = parseInt(value, 10);

				if (maxReplicas < minReplicas) {
					throw new Error("Max replicas cannot be smaller than min replicas");
				}

				return true;
			}),
		body("deploymentConfig.cpuMetric.enabled")
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isBoolean()
			.withMessage("Not a valid boolean value")
			.toBoolean(),
		body("deploymentConfig.cpuMetric.metricType")
			.if(
				(value, { req }) => req.body.deploymentConfig.cpuMetric.enabled === true
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isIn([
				"AverageUtilization",
				"AverageValueMillicores",
				"AverageValueCores",
			])
			.withMessage("Unsupported CPU metric type"),
		body("deploymentConfig.cpuMetric.metricValue")
			.if(
				(value, { req }) => req.body.deploymentConfig.cpuMetric.enabled === true
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
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
						throw new Error("CPU metric value must be a number");
					}

					if (parseInt(value, 10) < 1 || parseInt(value, 10) > 100) {
						throw new Error(`CPU metric value must be between ${1} and ${100}`);
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
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isBoolean()
			.withMessage("Not a valid boolean value")
			.toBoolean(),
		body("deploymentConfig.memoryMetric.metricType")
			.if(
				(value, { req }) =>
					req.body.deploymentConfig.memoryMetric.enabled === true
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isIn(["AverageValueMebibyte", "AverageValueGibibyte"])
			.withMessage("Unsupported memory metric type"),
		body("deploymentConfig.memoryMetric.metricValue")
			.if(
				(value, { req }) =>
					req.body.deploymentConfig.memoryMetric.enabled === true
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
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

export const checkProbes = () => {
	return [
		body("probes.startup.enabled")
			.if((value, { req }) =>
				["deployment", "statefulset"].includes(req.container.type)
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isBoolean()
			.withMessage("Not a valid boolean value")
			.toBoolean(),
		body("probes.startup.checkMechanism")
			.if(
				(value, { req }) =>
					req.body.probes.startup.enabled === true &&
					["deployment", "statefulset"].includes(req.container.type)
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isIn(["exec", "httpGet", "tcpSocket"])
			.withMessage("Unsupported startup probe check mechanism type"),
		body("probes.startup.initialDelaySeconds")
			.if(
				(value, { req }) =>
					req.body.probes.startup.enabled === true &&
					["deployment", "statefulset"].includes(req.container.type)
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
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
					["deployment", "statefulset"].includes(req.container.type)
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isInt({ min: 1, max: 3600 })
			.withMessage("Period seconds need to be an integer between 1 and 600")
			.toInt(),
		body("probes.startup.timeoutSeconds")
			.if(
				(value, { req }) =>
					req.body.probes.startup.enabled === true &&
					["deployment", "statefulset"].includes(req.container.type)
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isInt({ min: 1, max: 3600 })
			.withMessage("Timeout seconds need to be an integer between 1 and 600")
			.toInt(),
		body("probes.startup.failureThreshold")
			.if(
				(value, { req }) =>
					req.body.probes.startup.enabled === true &&
					["deployment", "statefulset"].includes(req.container.type)
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isInt({ min: 1, max: 20 })
			.withMessage("Failure threshold need to be an integer between 1 and 20")
			.toInt(),
		body("probes.startup.execCommand")
			.if(
				(value, { req }) =>
					req.body.probes.startup.enabled === true &&
					["deployment", "statefulset"].includes(req.container.type) &&
					req.body.probes.startup.checkMechanism === "exec"
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty"),
		body("probes.startup.tcpPort")
			.if(
				(value, { req }) =>
					req.body.probes.startup.enabled === true &&
					["deployment", "statefulset"].includes(req.container.type) &&
					req.body.probes.startup.checkMechanism === "tcpSocket"
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isInt({ min: 1, max: 65535 })
			.withMessage("Port must be an integer between 1 and 65535")
			.toInt(), // Converts the port number to an integer
		body("probes.startup.httpPath")
			.if(
				(value, { req }) =>
					req.body.probes.startup.enabled === true &&
					["deployment", "statefulset"].includes(req.container.type) &&
					req.body.probes.startup.checkMechanism === "httpGet"
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.custom((value) => value.startsWith("/"))
			.withMessage("Path must start with a '/' character")
			.bail()
			.customSanitizer((value) => value.replace(/\/+$/, "")), // Remove trailing slashes using custom sanitizer
		body("probes.startup.httpPort")
			.if(
				(value, { req }) =>
					req.body.probes.startup.enabled === true &&
					["deployment", "statefulset"].includes(req.container.type) &&
					req.body.probes.startup.checkMechanism === "httpGet"
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isInt({ min: 1, max: 65535 })
			.withMessage("Port must be an integer between 1 and 65535")
			.toInt(), // Converts the port number to an integer
		body("probes.readiness.enabled")
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isBoolean()
			.withMessage("Not a valid boolean value")
			.toBoolean(),
		body("probes.readiness.checkMechanism")
			.if((value, { req }) => req.body.probes.startup.enabled === true)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isIn(["exec", "httpGet", "tcpSocket"])
			.withMessage("Unsupported readiness probe check mechanism type"),
		body("probes.readiness.initialDelaySeconds")
			.if((value, { req }) => req.body.probes.startup.enabled === true)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
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
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isInt({ min: 1, max: 3600 })
			.withMessage("Period seconds need to be an integer between 1 and 600")
			.toInt(),
		body("probes.readiness.timeoutSeconds")
			.if((value, { req }) => req.body.probes.startup.enabled === true)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isInt({ min: 1, max: 3600 })
			.withMessage("Timeout seconds need to be an integer between 1 and 600")
			.toInt(),
		body("probes.readiness.failureThreshold")
			.if((value, { req }) => req.body.probes.startup.enabled === true)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
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
			.withMessage("Required field, cannot be left empty"),
		body("probes.readiness.tcpPort")
			.if(
				(value, { req }) =>
					req.body.probes.readiness.enabled === true &&
					req.body.probes.readiness.checkMechanism === "tcpSocket"
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
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
			.withMessage("Required field, cannot be left empty")
			.bail()
			.custom((value) => value.startsWith("/"))
			.withMessage("Path must start with a '/' character")
			.bail()
			.customSanitizer((value) => value.replace(/\/+$/, "")), // Remove trailing slashes using custom sanitizer
		body("probes.readiness.httpPort")
			.if(
				(value, { req }) =>
					req.body.probes.readiness.enabled === true &&
					req.body.probes.readiness.checkMechanism === "httpGet"
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isInt({ min: 1, max: 65535 })
			.withMessage("Port must be an integer between 1 and 65535")
			.toInt(), // Converts the port number to an integer
		body("probes.liveness.enabled")
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isBoolean()
			.withMessage("Not a valid boolean value")
			.toBoolean(),
		body("probes.liveness.checkMechanism")
			.if((value, { req }) => req.body.probes.startup.enabled === true)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isIn(["exec", "httpGet", "tcpSocket"])
			.withMessage("Unsupported liveness probe check mechanism type"),
		body("probes.liveness.initialDelaySeconds")
			.if((value, { req }) => req.body.probes.startup.enabled === true)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
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
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isInt({ min: 1, max: 3600 })
			.withMessage("Period seconds need to be an integer between 1 and 600")
			.toInt(),
		body("probes.liveness.timeoutSeconds")
			.if((value, { req }) => req.body.probes.startup.enabled === true)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isInt({ min: 1, max: 3600 })
			.withMessage("Timeout seconds need to be an integer between 1 and 600")
			.toInt(),
		body("probes.liveness.failureThreshold")
			.if((value, { req }) => req.body.probes.startup.enabled === true)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
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
			.withMessage("Required field, cannot be left empty"),
		body("probes.liveness.tcpPort")
			.if(
				(value, { req }) =>
					req.body.probes.liveness.enabled === true &&
					req.body.probes.liveness.checkMechanism === "tcpSocket"
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
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
			.withMessage("Required field, cannot be left empty")
			.bail()
			.custom((value) => value.startsWith("/"))
			.withMessage("Path must start with a '/' character")
			.bail()
			.customSanitizer((value) => value.replace(/\/+$/, "")), // Remove trailing slashes using custom sanitizer
		body("probes.liveness.httpPort")
			.if(
				(value, { req }) =>
					req.body.probes.liveness.enabled === true &&
					req.body.probes.liveness.checkMechanism === "httpGet"
			)
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isInt({ min: 1, max: 65535 })
			.withMessage("Port must be an integer between 1 and 65535")
			.toInt(), // Converts the port number to an integer
	];
};

export const checkStatefulSetConfig = () => {
	return [
		body("statefulSetConfig.desiredReplicas")
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isInt({ min: 1, max: 100 })
			.withMessage("Desired replicas must be an integer between 1 and 10")
			.toInt(), // Converts the replica number to an integer
		body("statefulSetConfig.persistentVolumeClaimRetentionPolicy.whenDeleted")
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isIn(["Retain", "Delete"])
			.withMessage("Unsupported storage retention policy"),
		body("statefulSetConfig.persistentVolumeClaimRetentionPolicy.whenScaled")
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isIn(["Retain", "Delete"])
			.withMessage("Unsupported storage retention policy"),
	];
};

export const checkCronJobConfig = () => {
	return [
		body("cronJobConfig.schedule")
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.custom((value) => {
				try {
					parser.parseExpression(value);
					return true;
				} catch (err) {
					throw new Error(`Not a valid cron expression. ${err.message}`);
				}
			}),
		body("cronJobConfig.timeZone")
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isIn(timezones.map((entry) => entry.value))
			.withMessage("Unsupported timezone"),
		body("cronJobConfig.concurrencyPolicy")
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isIn(["Allow", "Forbid", "Replace"])
			.withMessage("Unsupported coucurrency policy"),
		body("cronJobConfig.suspend")
			.trim()
			.notEmpty()
			.withMessage("Required field, cannot be left empty")
			.bail()
			.isBoolean()
			.withMessage("Not a valid boolean value")
			.toBoolean(),
	];
};
