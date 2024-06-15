import mongoose from "mongoose";
import { body, query } from "express-validator";
import { providerTypes } from "../config/constants.js";
import { isValidGitProviderAccessToken } from "../handlers/git.js";
/**
 * Message cron job and its handler definition
 */
export const GitProviderModel = mongoose.model(
	"git_provider",
	new mongoose.Schema(
		{
			iid: {
				// Internal identifier
				type: String,
				required: true,
				index: true,
				immutable: true,
			},
			userId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "user",
				index: true,
			},
			provider: {
				type: String,
				required: true,
				index: true,
			},
			providerUserId: {
				type: String,
				required: true,
				index: true,
			},
			accessToken: {
				type: String,
				required: true,
			},
			refreshToken: {
				type: String,
			},
			expiresAt: {
				type: Date,
				index: true,
			},
			isAccessTokenActive: {
				type: Boolean,
				default: true,
				index: true,
			},
			username: {
				type: String,
			},
			email: {
				type: String,
			},
			avatar: {
				type: String,
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
		case "get-repo-branches":
			return [
				query("repo")
					.if(
						(value, { req }) =>
							req.gitProvider.provider === "github" ||
							req.gitProvider.provider === "bitbucket"
					)
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty"),
				query("owner")
					.if(
						(value, { req }) =>
							req.gitProvider.provider === "github" ||
							req.gitProvider.provider === "bitbucket"
					)
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty"),
				query("repoId")
					.if((value, { req }) => req.gitProvider.provider === "gitlab")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty"),
			];
		default:
			return [];
	}
};
