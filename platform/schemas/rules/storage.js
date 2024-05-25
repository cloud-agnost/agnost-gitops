import { body } from "express-validator";

export default (actionType) => {
	return [
		body("config.size")
			.if(
				(value, { req }) =>
					req.body.type === "storage" && ["Minio"].includes(req.body.instance)
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
			.if(() => actionType === "update-config")
			.custom((value, { req }) => {
				if (!req.resource.managed) return true;
				const size = helper.memoryToBytes(value);
				const currentSize = helper.memoryToBytes(req.resource.config.size);
				if (size < currentSize)
					throw new AgnostError(
						t(
							"You can only inrease the storage size. The new storage size '%s' cannot be smaller than the existing size '%s'.",
							value,
							req.resource.config.size
						)
					);
				return true;
			}),
	];
};
