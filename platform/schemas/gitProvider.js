import mongoose from "mongoose";
import { body, query } from "express-validator";

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
						const { valid, error, user } =
							await helper.isValidGitProviderAccessToken(
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
		case "get-repo-branches":
			return [
				query("repo")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty")),
				query("owner")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty")),
			];
		default:
			return [];
	}
};
