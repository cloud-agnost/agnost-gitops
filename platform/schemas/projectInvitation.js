import config from "config";
import mongoose from "mongoose";
import { body, query } from "express-validator";
import prjCtrl from "../controllers/project.js";
import helper from "../util/helper.js";
import {
	projectRoles,
	orgRoles,
	invitationStatus,
} from "../config/constants.js";

/**
 * Project invitions. Each member first needs to be added to the organization.
 * Later on these members will be added to specific projects.
 */

export const ProjectInvitationModel = mongoose.model(
	"project_invitation",
	new mongoose.Schema({
		orgId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "organization",
			index: true,
			immutable: true,
		},
		projectId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "project",
			index: true,
			immutable: true,
		},
		email: {
			type: String,
			index: true,
			required: true,
			immutable: true,
		},
		token: {
			type: String,
			index: true,
			required: true,
			immutable: true,
		},
		role: {
			type: String,
			required: true,
			index: true,
			enum: projectRoles,
		},
		orgRole: {
			type: String,
			required: true,
			index: true,
			enum: orgRoles,
			default: "Developer",
		},
		status: {
			type: String,
			required: true,
			index: true,
			default: "Pending",
			enum: invitationStatus,
		},
		link: {
			type: String,
			index: true,
			required: true,
			immutable: true,
		},
		// Info about the person who invites the user
		host: {
			userId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "user",
				index: true,
			},
			name: {
				type: String,
				index: true,
			},
			pictureUrl: {
				type: String,
			},
			color: {
				// If no picture provided then this will be the avatar background color of the user
				type: String,
			},
			email: {
				// Independent of the provider we store the email address of the user
				type: String,
				index: true,
			},
		},
		createdAt: {
			type: Date,
			default: Date.now,
			index: true,
			immutable: true,
			//expire records after 1 month
			expires: helper.constants["1month"],
		},
		__v: {
			type: Number,
			select: false,
		},
	})
);

export const applyRules = (type) => {
	switch (type) {
		case "invite":
			return [
				query("uiBaseURL")
					.notEmpty()
					.withMessage("Required field, cannot be left empty"),
				body("*.email")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.isEmail()
					.withMessage("Not a valid email address")
					.bail()
					.normalizeEmail({ gmail_remove_dots: false })
					.custom(async (value, { req }) => {
						// Check whether the user is already a member of the project
						let projectWithTeam = await prjCtrl.getOneById(req.project._id, {
							lookup: {
								path: "team.userId",
							},
						});

						// Check whether the user is already a member of the project team or not
						let projectMember = projectWithTeam.team.find(
							(entry) => entry.userId.email === value
						);

						if (projectMember)
							throw new Error("User is already a member of the project");

						return true;
					}),
				body("*.role")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.isIn(projectRoles)
					.withMessage("Unsupported project member role"),
			];
		case "update-invite":
			return [
				query("token")
					.trim()
					.notEmpty()
					.withMessage("Required parameter, cannot be left empty"),
				body("role")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.isIn(projectRoles)
					.withMessage("Unsupported project member role"),
			];
		case "delete-invite":
			return [
				query("token")
					.trim()
					.notEmpty()
					.withMessage("Required parameter, cannot be left empty"),
			];
		case "delete-invite-multi":
			return [
				body("tokens")
					.notEmpty()
					.withMessage("Required parameter, cannot be left empty")
					.bail()
					.isArray()
					.withMessage("Invitation tokens needs to be an array of strings"),
				body("tokens.*")
					.trim()
					.notEmpty()
					.withMessage("Required parameter, cannot be left empty"),
			];
		case "get-invites":
			return [
				query("start")
					.trim()
					.optional()
					.isISO8601({ strict: true, strictSeparator: true })
					.withMessage("Not a valid ISO 8061 date-time")
					.toDate(),
				query("end")
					.trim()
					.optional()
					.isISO8601({ strict: true, strictSeparator: true })
					.withMessage("Not a valid ISO 8061 date-time")
					.toDate(),
				query("page")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.isInt({
						min: 0,
					})
					.withMessage("Page number needs to be a positive integer or 0 (zero)")
					.toInt(),
				query("size")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.isInt({
						min: config.get("general.minPageSize"),
						max: config.get("general.maxPageSize"),
					})
					.withMessage(
						`Page size needs to be an integer, between ${config.get(
							"general.minPageSize"
						)} and ${config.get("general.maxPageSize")}`
					)
					.toInt(),
			];
		case "list-eligible":
			return [
				query("page")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.isInt({
						min: 0,
					})
					.withMessage("Page number needs to be a positive integer or 0 (zero)")
					.toInt(),
				query("size")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.isInt({
						min: config.get("general.minPageSize"),
						max: config.get("general.maxPageSize"),
					})
					.withMessage(
						`Page size needs to be an integer, between ${config.get(
							"general.minPageSize"
						)} and ${config.get("general.maxPageSize")}`
					)
					.toInt(),
			];
		default:
			return [];
	}
};
