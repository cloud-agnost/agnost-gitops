import config from "config";
import mongoose from "mongoose";
import { body, param, query } from "express-validator";
import { projectRoles } from "../config/constants.js";
import { ProjectEnvModel } from "./environment.js";
import { getK8SResource } from "../handlers/util.js";
import helper from "../util/helper.js";

/**
 * An project is your workspace that packages all project environments and associated containers.
 */
export const ProjectModel = mongoose.model(
	"project",
	new mongoose.Schema(
		{
			orgId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "organization",
				index: true,
			},
			iid: {
				// Internal identifier
				type: String,
				required: true,
				index: true,
				immutable: true,
			},
			ownerUserId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "user",
				index: true,
			},
			name: {
				type: String,
				required: true,
				index: true,
			},
			pictureUrl: {
				type: String,
			},
			color: {
				// If no picture provided then this will be the avatar background color of the project
				type: String,
			},
			team: [
				{
					userId: {
						type: mongoose.Schema.Types.ObjectId,
						ref: "user",
					},
					role: {
						type: String,
						required: true,
						index: true,
						enum: projectRoles,
					},
					joinDate: {
						type: Date,
						default: Date.now,
						immutable: true,
					},
				},
			],
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
		case "create":
		case "update":
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
						let projects = await ProjectModel.find({});
						projects.forEach((project) => {
							if (
								project.name.toLowerCase() === value.toLowerCase() &&
								type === "create"
							)
								throw new Error(
									"Project with the provided name already exists"
								);

							if (
								project.name.toLowerCase() === value.toLowerCase() &&
								type === "update" &&
								req.project._id.toString() !== project._id.toString()
							)
								throw new Error(
									"Project with the provided name already exists"
								);
						});
						return true;
					}),
				body("envName")
					.if(() => type === "create")
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
						let environment = await ProjectEnvModel.findOne({
							iid: value,
						});

						if (environment) {
							throw new Error(
								"Environment with the provided name or internal identifier already exists within the cluster"
							);
						}

						const namespace = await getK8SResource("Namespace", value);
						if (namespace) {
							throw new Error(
								"A Kubernetes namespace with the provided environment name already exists within the cluster"
							);
						}

						return true;
					}),
			];
		case "update-member-role":
			return [
				param("userId")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.custom(async (value) => {
						if (!helper.isValidId(value))
							throw new Error("Not a valid user identifier");

						return true;
					}),
				body("role")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.isIn(projectRoles)
					.withMessage("Unsupported team member role"),
			];
		case "remove-member":
			return [
				param("userId")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.custom(async (value) => {
						if (!helper.isValidId(value))
							throw new Error("Not a valid user identifier");

						return true;
					}),
			];
		case "remove-members":
			return [
				body("userIds")
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.isArray()
					.withMessage("User identifiers need to be an array of strings"),
				body("userIds.*")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.custom(async (value) => {
						if (!helper.isValidId(value))
							throw new Error("Not a valid user identifier");

						return true;
					}),
			];
		case "transfer":
			return [
				param("userId")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.custom(async (value) => {
						if (!helper.isValidId(value))
							throw new Error("Not a valid user identifier");

						return true;
					})
					.bail()
					.custom((value, { req }) => {
						// Check whether email is unique or not
						let projectMember = req.project.team.find(
							(entry) => entry.userId.toString() === value
						);

						if (!projectMember) {
							throw new Error(
								`The user identified with id '${value}' is not a member of project '${req.project.name}'. Project ownership can only be transferred to an existing project member with 'Admin' role.`
							);
						}

						if (projectMember.role !== "Admin") {
							throw new Error(
								"Project ownership can only be transferred to an existing project member with 'Admin' role."
							);
						}

						return true;
					}),
			];
		case "upload-picture":
			return [
				query("width")
					.trim()
					.optional({ nullable: true })
					.isInt({ min: 1 })
					.withMessage("Width needs to be a positive integer")
					.toInt(),
				query("height")
					.trim()
					.optional({ nullable: true })
					.isInt({ min: 1 })
					.withMessage("Height needs to be a positive integer")
					.toInt(),
			];
		default:
			return [];
	}
};
