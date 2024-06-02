import mongoose from "mongoose";
import { body, param, query } from "express-validator";
import {
	providerTypes,
	notificationTypes,
	userStatus,
} from "../config/constants.js";
import userCtrl from "../controllers/user.js";
import { isValidGitProviderAccessToken } from "../handlers/git.js";

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
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.isIn(["github"])
					.withMessage(t("Unsupported Git repository provider")),
				body("accessToken")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.custom(async (value, { req }) => {
						const { valid, error, user } = await isValidGitProviderAccessToken(
							value,
							req.body.provider
						);

						if (!valid) throw new AgnostError(error);

						// Assign git user to the request body
						req.body.gitUser = user;
						return true;
					}),
				body("refreshToken").trim().optional(),
			];
		case "end-setup":
			return [
				body("orgName")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.isLength({ max: config.get("general.maxTextLength") })
					.withMessage(
						t(
							"Name must be at most %s characters long",
							config.get("general.maxTextLength")
						)
					),
				body("projectName")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.isLength({ max: config.get("general.maxTextLength") })
					.withMessage(
						t(
							"Name must be at most %s characters long",
							config.get("general.maxTextLength")
						)
					),
				body("environmentName")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.isLength({ max: config.get("general.maxTextLength") })
					.withMessage(
						t(
							"Name must be at most %s characters long",
							config.get("general.maxTextLength")
						)
					),
			];
		case "update-name":
			return [
				body("name")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.isLength({
						min: config.get("general.minNameLength"),
						max: config.get("general.maxTextLength"),
					})
					.withMessage(
						t(
							"Name must be minimum %s and maximum %s characters long",
							config.get("general.minNameLength"),
							config.get("general.maxTextLength")
						)
					),
			];
		case "update-notifications":
			return [
				body("notifications.*")
					.trim()
					.notEmpty()
					.withMessage(t("Required value, cannot be left empty"))
					.bail()
					.isIn(notificationTypes)
					.withMessage(t("Unsupported notification type")),
			];
		case "upload-picture":
			return [
				query("width")
					.trim()
					.optional({ nullable: true })
					.isInt({ min: 1 })
					.withMessage(t("Width needs to be a positive integer"))
					.toInt(),
				query("height")
					.trim()
					.optional({ nullable: true })
					.isInt({ min: 1 })
					.withMessage(t("Height needs to be a positive integer"))
					.toInt(),
			];
		case "accept-org-invite":
		case "accept-project-invite":
			return [
				query("token")
					.trim()
					.notEmpty()
					.withMessage(t("Required parameter, cannot be left empty")),
				query("provider")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.isIn(["github"])
					.withMessage(t("Unsupported Git repository provider")),
				query("accessToken")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.custom(async (value, { req }) => {
						const { valid, error, user } = await isValidGitProviderAccessToken(
							value,
							req.body.provider
						);

						if (!valid) throw new AgnostError(error);

						// Assign git user to the request body
						req.body.gitUser = user;
						return true;
					}),
				query("refreshToken").trim().optional(),
			];
		case "reject-org-invite":
		case "reject-project-invite":
			return [
				query("token")
					.trim()
					.notEmpty()
					.withMessage(t("Required parameter, cannot be left empty")),
			];
		case "transfer":
			return [
				param("userId")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.custom(async (value, { req }) => {
						if (!helper.isValidId(value))
							throw new AgnostError(t("Not a valid user identifier"));

						return true;
					})
					.bail()
					.custom(async (value, { req }) => {
						let userObj = await userCtrl.getOneByQuery(
							{
								_id: value,
							},
							{ cacheKey: `${value}` }
						);

						if (!userObj) {
							throw new AgnostError(
								t(
									"The user identified with id '%s' is not a member the Agnost Cluster. Cluster ownership can only be transferred to an existing cluster member in 'Active' status.",
									value
								)
							);
						}

						if (userObj.status !== "Active") {
							throw new AgnostError(
								t(
									"Cluster ownership can only be transferred to an existing cluster member in 'Active' status."
								)
							);
						}

						return true;
					}),
			];
		default:
			return [];
	}
};
