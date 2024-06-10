import config from "config";
import mongoose from "mongoose";
import { body } from "express-validator";
import { getK8SResource } from "../handlers/util.js";

/**
 * An project environment is where containers are deployed and run. It can be a development, staging, or production environment.
 */
export const ProjectEnvModel = mongoose.model(
	"environment",
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
			iid: {
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
			// Whether other team members with the right access can see the project environment or not
			// Team members with 'Admin' role can always view even the private environments
			private: {
				type: Boolean,
				default: false,
			},
			// Whether other team members can edit the environment or not
			readOnly: {
				type: Boolean,
				default: true,
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

export const applyRules = (type) => {
	switch (type) {
		case "update":
		case "create":
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
						)} and maximum ${config.get(
							"general.maxTextLength"
						)} characters long`
					)
					.bail()
					.matches(
						/^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/
					)
					.withMessage(
						"Environment name can only contain lowercase alphanumeric characters, hyphens and dots, and cannot start or end with a hyphen or dot"
					)
					.bail()
					.custom(async (value, { req }) => {
						let environments = await ProjectEnvModel.find({
							$or: [{ name: value }, { iid: value }],
						});
						environments.forEach((environment) => {
							if (
								(environment.name.toLowerCase() === value.toLowerCase() ||
									environment.iid === value.toLowerCase()) &&
								type === "create"
							)
								throw new Error(
									"Environment with the provided name or internal identifier already exists"
								);

							if (
								(environment.name.toLowerCase() === value.toLowerCase() ||
									environment.iid === value.toLowerCase()) &&
								type === "update" &&
								req.environment._id.toString() !== environment._id.toString()
							)
								throw new Error(
									"Environment with the provided name or internal identifier already exists"
								);
						});

						const namespace = await getK8SResource("Namespace", value);
						if (namespace) {
							throw new Error(
								"A Kubernetes namespace with the provided environment name already exists within the cluster"
							);
						}

						return true;
					}),
				body("private")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.isBoolean()
					.withMessage("Not a valid boolean value")
					.toBoolean(),
				body("readOnly")
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
