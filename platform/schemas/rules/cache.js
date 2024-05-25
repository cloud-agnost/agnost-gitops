import { body } from "express-validator";
import { cacheTypes } from "../../config/constants.js";

export default (actionType) => {
	return [
		body("config.version")
			.if(
				(value, { req }) =>
					req.body.type === "cache" && cacheTypes.includes(req.body.instance)
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty")),
		body("config.size")
			.if(
				(value, { req }) =>
					req.body.type === "cache" && cacheTypes.includes(req.body.instance)
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.matches(/^([1-9]\d*(Mi|Gi))$/)
			.withMessage(
				t(
					"Cache size should be specified in non-zero Mi or Gi (e.g., 500Mi or 1Gi)"
				)
			)
			.bail()
			.custom((value, { req }) => {
				const size = helper.memoryToBytes(value);
				if (size < config.get("general.minCacheSizeMi") * Math.pow(2, 20))
					return false;
				return true;
			})
			.withMessage(
				t(
					"Cache size can be minimum %sMi",
					config.get("general.minCacheSizeMi")
				)
			)
			.bail()
			.if(() => actionType === "update-config")
			.custom((value, { req }) => {
				const size = helper.memoryToBytes(value);
				const currentSize = helper.memoryToBytes(req.resource.config.size);
				if (size < currentSize)
					throw new AgnostError(
						t(
							"You can only inrease the size of a cache. The new cache size '%s' cannot be smaller than the existing size '%s'.",
							value,
							req.resource.config.size
						)
					);
				return true;
			}),
		// Read replica configuration cannot be updated, read-only
		body("config.readReplica")
			.if(
				(value, { req }) =>
					req.body.type === "cache" &&
					cacheTypes.includes(req.body.instance) &&
					actionType === "create"
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isBoolean()
			.withMessage(t("Not a valid boolean value"))
			.toBoolean(),
	];
};
