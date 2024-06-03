import config from "config";
import mongoose from "mongoose";
import { body } from "express-validator";

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
					.custom(async (value, { req }) => {
						let environments = await ProjectEnvModel.find({
							projectId: req.project._id,
						});
						environments.forEach((environment) => {
							if (
								environment.name.toLowerCase() === value.toLowerCase() &&
								type === "create"
							)
								throw new Error(
									"Environment with the provided name already exists"
								);

							if (
								environment.name.toLowerCase() === value.toLowerCase() &&
								type === "update" &&
								req.environment._id.toString() !== environment._id.toString()
							)
								throw new Error(
									"Environment with the provided name already exists"
								);
						});

						if (value.toLowerCase() === "this") {
							throw new Error(
								`'${value}' is a reserved keyword and cannot be used as environment name`
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
