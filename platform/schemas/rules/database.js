import { body } from "express-validator";
export default (actionType) => {
	return [
		// General for all databases
		body("updateType")
			.if(
				(value, { req }) =>
					req.body.type === "database" && actionType === "update-config"
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isIn(["size", "others"])
			.withMessage(t("Unsupported database resource update type")),
		// MongoDB
		body("config.version")
			.if(
				(value, { req }) =>
					req.body.type === "database" &&
					["MongoDB"].includes(req.body.instance)
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty")),
		body("config.size")
			.if(
				(value, { req }) =>
					req.body.type === "database" &&
					["MongoDB"].includes(req.body.instance)
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.matches(/^([1-9]\d*(Mi|Gi))$/)
			.withMessage(
				t(
					"Storage size should be specified in non-zero Mi or Gi (e.g., 500Mi or 1Gi)"
				)
			)
			.bail()
			.custom((value, { req }) => {
				const size = helper.memoryToBytes(value);
				if (size < config.get("general.minDatabaseSizeMi") * Math.pow(2, 20))
					return false;
				return true;
			})
			.withMessage(
				t(
					"Storage size can be minimum %sMi",
					config.get("general.minDatabaseSizeMi")
				)
			)
			.bail()
			.if(() => actionType === "update-config")
			.custom((value, { req }) => {
				if (!req.resource.managed) return true;
				const size = helper.memoryToBytes(value);
				const currentSize = helper.memoryToBytes(req.resource.config.size);
				if (size < currentSize)
					throw new AgnostError(
						t(
							"You can only inrease the storage size of a database. The new storage size '%s' cannot be smaller than the existing size '%s'.",
							value,
							req.resource.config.size
						)
					);
				return true;
			}),
		body("config.replicas")
			.if(
				(value, { req }) =>
					req.body.type === "database" &&
					["MongoDB"].includes(req.body.instance)
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({
				min: 1,
				max: 9,
			})
			.withMessage(t("Replica count can be minimum 1 and maximum 9"))
			.toInt(),
		// PostgreSQL
		body("config.version")
			.if(
				(value, { req }) =>
					req.body.type === "database" &&
					["PostgreSQL"].includes(req.body.instance)
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty")),
		body("config.size")
			.if(
				(value, { req }) =>
					req.body.type === "database" &&
					["PostgreSQL"].includes(req.body.instance)
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.matches(/^([1-9]\d*(Mi|Gi))$/)
			.withMessage(
				t(
					"Storage size should be specified in non-zero Mi or Gi (e.g., 500Mi or 1Gi)"
				)
			)
			.bail()
			.custom((value, { req }) => {
				const size = helper.memoryToBytes(value);
				if (size < config.get("general.minDatabaseSizeMi") * Math.pow(2, 20))
					return false;
				return true;
			})
			.withMessage(
				t(
					"Storage size can be minimum %sMi",
					config.get("general.minDatabaseSizeMi")
				)
			)
			.bail()
			.if(() => actionType === "update-config")
			.custom((value, { req }) => {
				if (!req.resource.managed) return true;
				const size = helper.memoryToBytes(value);
				const currentSize = helper.memoryToBytes(req.resource.config.size);
				if (size < currentSize)
					throw new AgnostError(
						t(
							"You can only inrease the storage size of a database. The new storage size '%s' cannot be smaller than the existing size '%s'.",
							value,
							req.resource.config.size
						)
					);
				return true;
			}),
		body("config.instances")
			.if(
				(value, { req }) =>
					req.body.type === "database" &&
					["PostgreSQL"].includes(req.body.instance)
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({
				min: 1,
				max: 9,
			})
			.withMessage(t("Instance count can be minimum 1 and maximum 9"))
			.toInt(),
		// MySQL
		body("config.version")
			.if(
				(value, { req }) =>
					req.body.type === "database" && ["MySQL"].includes(req.body.instance)
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty")),
		body("config.size")
			.if(
				(value, { req }) =>
					req.body.type === "database" && ["MySQL"].includes(req.body.instance)
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.matches(/^([1-9]\d*(Mi|Gi))$/)
			.withMessage(
				t(
					"Storage size should be specified in non-zero Mi or Gi (e.g., 500Mi or 1Gi)"
				)
			)
			.bail()
			.custom((value, { req }) => {
				const size = helper.memoryToBytes(value);
				if (size < config.get("general.minDatabaseSizeMi") * Math.pow(2, 20))
					return false;
				return true;
			})
			.withMessage(
				t(
					"Storage size can be minimum %sMi",
					config.get("general.minDatabaseSizeMi")
				)
			)
			.bail()
			.if(() => actionType === "update-config")
			.custom((value, { req }) => {
				if (!req.resource.managed) return true;
				const size = helper.memoryToBytes(value);
				const currentSize = helper.memoryToBytes(req.resource.config.size);
				if (size < currentSize)
					throw new AgnostError(
						t(
							"You can only inrease the storage size of a database. The new storage size '%s' cannot be smaller than the existing size '%s'.",
							value,
							req.resource.config.size
						)
					);
				return true;
			}),
		body("config.instances")
			.if(
				(value, { req }) =>
					req.body.type === "database" && ["MySQL"].includes(req.body.instance)
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({
				min: 1,
				max: 9,
			})
			.withMessage(t("Instance count can be minimum 1 and maximum 9"))
			.toInt(),
	];
};
