import config from "config";
import mongoose from "mongoose";
import { body, param, query } from "express-validator";
import {
	providerTypes,
	notificationTypes,
	userStatus,
} from "../config/constants.js";
import userCtrl from "../controllers/user.js";
import { isValidGitProviderAccessToken } from "../handlers/git.js";
import { getK8SResource } from "../handlers/util.js";
import helper from "../util/helper.js";

/**
 * Models the user information. Users will be associated with organizations and projects. Project users will be part of the organization
 * where the project is created.
 */
export const UserModel = mongoose.model(
	"user",
	new mongoose.Schema(
		{
			iid: {
				// Internal identifier
				type: String,
				required: true,
				index: true,
				immutable: true,
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
			lastLoginAt: {
				type: Date,
				index: true,
			},
			canCreateOrg: {
				type: Boolean,
				default: false,
			},
			isClusterOwner: {
				type: Boolean,
				default: false,
			},
			provider: {
				// Type of the login profile such as agnost, github, bitbucket, gitlab etc. The provider name should be all lowercase letters.
				type: String,
				required: true,
				index: true,
				enum: providerTypes,
			},
			providerUserId: {
				// In case of other providers such as github, this field will hold the github or gitlab identifer of the user
				type: String,
				required: true,
				index: true,
			},
			notifications: {
				type: [String],
				enum: notificationTypes,
			},
			status: {
				type: String,
				required: true,
				default: "Pending",
				enum: userStatus,
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
		case "login":
		case "start-setup":
			return [
				body("provider")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.isIn(providerTypes)
					.withMessage("Unsupported Git repository provider"),
				body("accessToken")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.customSanitizer((value) => {
						return decodeURIComponent(value);
					})
					.custom(async (value, { req }) => {
						const { valid, error, user } = await isValidGitProviderAccessToken(
							value,
							req.body.provider
						);

						if (!valid) throw new Error(error);

						// Assign git user to the request body
						req.body.gitUser = user;
						return true;
					}),
				body("refreshToken")
					.if(
						(value, { req }) =>
							req.body.provider === "gitlab" ||
							req.body.provider === "bitbucket"
					)
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.customSanitizer((value) => {
						return decodeURIComponent(value);
					}),
				body("expiresAt")
					.if(
						(value, { req }) =>
							req.body.provider === "gitlab" ||
							req.body.provider === "bitbucket"
					)
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.isInt({ min: 0 }) // Check if it's a positive integer
					.customSanitizer((value) => {
						const date = new Date(value * 1000);
						return isNaN(date.getTime()) ? null : date;
					})
					.withMessage("Invalid epoch timestamp"),
			];
		case "end-setup":
			return [
				body("orgName")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.isLength({ max: config.get("general.maxTextLength") })
					.withMessage(
						`Name must be at most ${config.get(
							"general.maxTextLength"
						)} characters long`
					),
				body("projectName")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.isLength({ max: config.get("general.maxTextLength") })
					.withMessage(
						`Name must be at most ${config.get(
							"general.maxTextLength"
						)} characters long`
					),
				body("environmentName")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.isLength({ max: config.get("general.maxTextLength") })
					.withMessage(
						`Name must be at most ${config.get(
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
						const namespace = await getK8SResource("Namespace", value);
						if (namespace) {
							throw new Error(
								"A Kubernetes namespace with the provided environment name already exists within the cluster"
							);
						}

						return true;
					}),
			];
		case "update-name":
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
					),
			];
		case "update-notifications":
			return [
				body("notifications.*")
					.trim()
					.notEmpty()
					.withMessage("Required value, cannot be left empty")
					.bail()
					.isIn(notificationTypes)
					.withMessage("Unsupported notification type"),
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
		case "accept-org-invite":
		case "accept-project-invite":
			return [
				query("token")
					.trim()
					.notEmpty()
					.withMessage("Required parameter, cannot be left empty"),
				query("provider")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.isIn(providerTypes)
					.withMessage("Unsupported Git repository provider"),
				query("accessToken")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.customSanitizer((value) => {
						return decodeURIComponent(value);
					})
					.custom(async (value, { req }) => {
						const { valid, error, user } = await isValidGitProviderAccessToken(
							value,
							req.query.provider
						);

						if (!valid) throw new Error(error);

						// Assign git user to the request body
						req.body.gitUser = user;
						return true;
					}),
				query("refreshToken")
					.if(
						(value, { req }) =>
							req.query.provider === "gitlab" ||
							req.query.provider === "bitbucket"
					)
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.customSanitizer((value) => {
						return decodeURIComponent(value);
					}),
				query("expiresAt")
					.if(
						(value, { req }) =>
							req.query.provider === "gitlab" ||
							req.query.provider === "bitbucket"
					)
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.isInt({ min: 0 }) // Check if it's a positive integer
					.customSanitizer((value) => {
						const date = new Date(value * 1000);
						return isNaN(date.getTime()) ? null : date;
					})
					.withMessage("Invalid epoch timestamp"),
			];
		case "accept-org-invite-session":
		case "accept-project-invite-session":
		case "reject-org-invite":
		case "reject-project-invite":
			return [
				query("token")
					.trim()
					.notEmpty()
					.withMessage("Required parameter, cannot be left empty"),
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
					.custom(async (value) => {
						let userObj = await userCtrl.getOneByQuery(
							{
								_id: value,
							},
							{ cacheKey: `${value}` }
						);

						if (!userObj) {
							throw new Error(
								`The user identified with id '${value}' is not a member the Agnost Cluster. Cluster ownership can only be transferred to an existing cluster member in 'Active' status.`
							);
						}

						if (userObj.status !== "Active") {
							throw new Error(
								"Cluster ownership can only be transferred to an existing cluster member in 'Active' status."
							);
						}

						return true;
					}),
			];
		default:
			return [];
	}
};
