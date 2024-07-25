import config from "config";
import mongoose from "mongoose";
import { query } from "express-validator";
import helper from "../util/helper.js";

/**
 * Account is the top level model which will hold the list of organizations, under organization there will be users and apps etc.
 * Whenever a new users signs up a personal account with 'Admin' role will be creted. When a user joins to an organization, a new account entry
 * will be added for the user with the specified role type
 */
export const AuditModel = mongoose.model(
	"audit",
	new mongoose.Schema({
		// Object type e.g., user, organization, app etc.
		object: {
			type: String,
			required: true,
			index: true,
		},
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
		environmentId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "environment",
			index: true,
		},
		containerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "container",
			index: true,
		},
		// Action type e.g., create, update, delete
		action: {
			type: String,
			required: true,
			index: true,
		},
		// Info about the person who took the action
		actor: {
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
				type: String,
				index: true,
			},
		},
		// Descriptive text about the action (e.g., created project 'my project')
		description: {
			type: String,
		},
		// Data of the action e.g., if an app is created then the created app object data
		data: {
			type: mongoose.Schema.Types.Mixed,
		},
		// Datetime of the action. Audit logs are kept only for 3 months and any older logs will be automatically deleted
		createdAt: {
			type: Date,
			default: Date.now,
			index: true,
			immutable: true,
			// Expire records after 1 year
			expires: helper.constants["3months"],
		},
		__v: {
			type: Number,
			select: false,
		},
	})
);

export const applyRules = (type) => {
	switch (type) {
		case "view-logs":
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
				query("projectId")
					.trim()
					.optional()
					.custom(async (value) => {
						if (!helper.isValidId(value))
							throw new Error("Not a valid project identifier");

						return true;
					}),
				query("envId")
					.trim()
					.optional()
					.custom(async (value) => {
						if (!helper.isValidId(value))
							throw new Error("Not a valid environment identifier");

						return true;
					}),
			];
		case "view-filters":
			return [
				query("projectId")
					.trim()
					.optional()
					.custom(async (value) => {
						if (!helper.isValidId(value))
							throw new Error("Not a valid project identifier");

						return true;
					}),
				query("envId")
					.trim()
					.optional()
					.custom(async (value) => {
						if (!helper.isValidId(value))
							throw new Error("Not a valid environment identifier");

						return true;
					}),
			];
		default:
			return [];
	}
};
