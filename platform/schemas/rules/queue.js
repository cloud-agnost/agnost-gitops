import { body } from "express-validator";

export default (actionType) => {
	return [
		body("config.version")
			.if(
				(value, { req }) =>
					req.body.type === "queue" && ["RabbitMQ"].includes(req.body.instance)
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty")),
		body("config.size")
			.if(
				(value, { req }) =>
					req.body.type === "queue" && ["RabbitMQ"].includes(req.body.instance)
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.matches(/^([1-9]\d*(Mi|Gi))$/)
			.withMessage(
				t(
					"Persistent storage size should be specified in non-zero Mi or Gi (e.g., 500Mi or 1Gi)"
				)
			)
			.bail()
			.custom((value, { req }) => {
				const size = helper.memoryToBytes(value);
				if (size < config.get("general.minQueueSizeMi") * Math.pow(2, 20))
					return false;
				return true;
			})
			.withMessage(
				t(
					"Persistent storage size can be minimum %sMi",
					config.get("general.minQueueSizeMi")
				)
			)
			.bail()
			.if(() => actionType === "update-config")
			.custom((value, { req }) => {
				const size = helper.memoryToBytes(value);
				const currentSize = helper.memoryToBytes(req.resource?.config.size);
				if (size < currentSize)
					throw new AgnostError(
						t(
							"You can only inrease the persistent storage size of a message broker. The new persistent storage size '%s' cannot be smaller than the existing size '%s'.",
							value,
							req.resource?.config.size
						)
					);
				return true;
			}),
		body("config.replicas")
			.if(
				(value, { req }) =>
					req.body.type === "queue" && ["RabbitMQ"].includes(req.body.instance)
			)
			.trim()
			.notEmpty()
			.withMessage(t("Required field, cannot be left empty"))
			.bail()
			.isInt({
				min: 1,
			})
			.withMessage(t("Replica count needs to be a positive integer"))
			.bail()
			.toInt()
			.if(() => actionType === "update-config")
			.custom((value, { req }) => {
				if (value < req.resource?.config.replicas)
					throw new AgnostError(
						t(
							"RabbitMQ cluster scale down not supported. You cannot decrease the replica count from '%s' to '%s'.",
							req.resource?.config.replicas,
							value
						)
					);
				return true;
			}),
	];
};
