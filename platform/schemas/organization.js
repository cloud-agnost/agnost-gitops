import mongoose from "mongoose";
import { body, query, param } from "express-validator";
import orgMemberCtrl from "../controllers/organizationMember.js";
/**
 * Each account can have multiple organizations and an organization is the top level entitiy used to hold all apps and its associated design elements.
 */
export const OrganizationModel = mongoose.model(
	"organization",
	new mongoose.Schema(
		{
			ownerUserId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "user",
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
			pictureUrl: {
				type: String,
			},
			color: {
				// If no picture provided then this will be the avatar background color of the organization
				type: String,
			},
			createdBy: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "user",
				index: true,
			},
			updatedBy: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "user",
				index: true,
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
					)
					.bail()
					.custom((value) => {
						let regex = /^[A-Za-z0-9 _.-]+$/;
						if (!regex.test(value)) {
							throw new AgnostError(
								t(
									"Organization names can include only numbers, letters, spaces, dash, dot and underscore characters"
								)
							);
						}

						let regex2 = /^[ _-].*$/;
						if (regex2.test(value)) {
							throw new AgnostError(
								t(
									"Organization names cannot start with a dash or underscore character"
								)
							);
						}

						//Indicates the success of this synchronous custom validator
						return true;
					}),
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
						let orgMember = await orgMemberCtrl.getOneByQuery(
							{
								orgId: req.org._id,
								userId: value,
							},
							{ cacheKey: `${req.org._id}.${value}` }
						);

						if (!orgMember) {
							throw new AgnostError(
								t(
									"The user identified with id '%s' is not a member of organization '%s'. Organization ownership can only be transferred to an existing organization member with 'Admin' role.",
									value,
									req.org.name
								)
							);
						}

						if (orgMember.role !== "Admin") {
							throw new AgnostError(
								t(
									"Organization ownership can only be transferred to an existing organization member with 'Admin' role.",
									req.org.name
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
