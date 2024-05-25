import mongoose from "mongoose";
import { body, query } from "express-validator";
import helper from "../util/helper.js";
import userCtrl from "../controllers/user.js";
import orgMemberCtrl from "../controllers/organizationMember.js";
import { orgRoles, invitationStatus } from "../config/constants.js";
/**
 * Organization invitions. Each member is first needs to be added to the organization.
 * Later on these members will be aded to specific apps.
 */

export const OrgInvitationModel = mongoose.model(
	"organization_invitation",
	new mongoose.Schema({
		orgId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "organization",
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
			enum: orgRoles,
			required: true,
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
			expires: helper.constants["1week"],
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
					.withMessage(t("Required field, cannot be left empty")),
				body("*.email")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.isEmail()
					.withMessage(t("Not a valid email address"))
					.bail()
					.normalizeEmail({ gmail_remove_dots: false })
					.custom(async (value, { req }) => {
						// Check whether a user with the provided email is already a member of the organization
						let user = await userCtrl.getOneByQuery({
							"loginProfiles.provider": "agnost",
							"loginProfiles.email": value,
						});

						if (user) {
							let member = await orgMemberCtrl.getOneByQuery(
								{ orgId: req.org._id, userId: user._id }
								//{ cacheKey: `${req.org._id}.${user._id}` }
							);
							if (member)
								throw new AgnostError(
									t("User is already a member of the organization")
								);
						}
						return true;
					}),
				body("*.role")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.isIn(orgRoles)
					.withMessage(t("Unsupported member role")),
			];
		case "update-invite":
			return [
				query("token")
					.trim()
					.notEmpty()
					.withMessage(t("Required parameter, cannot be left empty")),
				body("role")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.isIn(orgRoles)
					.withMessage(t("Unsupported member role")),
			];
		case "delete-invite":
			return [
				query("token")
					.trim()
					.notEmpty()
					.withMessage(t("Required parameter, cannot be left empty")),
			];
		case "delete-invite-multi":
			return [
				body("tokens")
					.notEmpty()
					.withMessage(t("Required parameter, cannot be left empty"))
					.bail()
					.isArray()
					.withMessage(t("Invitation tokens needs to be an array of strings")),
				body("tokens.*")
					.trim()
					.notEmpty()
					.withMessage(t("Required parameter, cannot be left empty")),
			];
		case "get-invites":
			return [
				query("start")
					.trim()
					.optional()
					.isISO8601({ strict: true, strictSeparator: true })
					.withMessage(t("Not a valid ISO 8061 date-time"))
					.toDate(),
				query("end")
					.trim()
					.optional()
					.isISO8601({ strict: true, strictSeparator: true })
					.withMessage(t("Not a valid ISO 8061 date-time"))
					.toDate(),
				query("page")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.isInt({
						min: 0,
					})
					.withMessage(
						t("Page number needs to be a positive integer or 0 (zero)")
					)
					.toInt(),
				query("size")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.isInt({
						min: config.get("general.minPageSize"),
						max: config.get("general.maxPageSize"),
					})
					.withMessage(
						t(
							"Page size needs to be an integer, between %s and %s",
							config.get("general.minPageSize"),
							config.get("general.maxPageSize")
						)
					)
					.toInt(),
			];
		default:
			return [];
	}
};
