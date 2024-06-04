import config from "config";
import mongoose from "mongoose";
import { body, query, param } from "express-validator";
import orgMemberCtrl from "../controllers/organizationMember.js";
import helper from "../util/helper.js";

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
						let organizations = await OrganizationModel.find({});
						organizations.forEach((org) => {
							if (
								org.name.toLowerCase() === value.toLowerCase() &&
								type === "create"
							)
								throw new Error(
									"Organization with the provided name already exists"
								);

							if (
								org.name.toLowerCase() === value.toLowerCase() &&
								type === "update" &&
								req.org._id.toString() !== org._id.toString()
							)
								throw new Error(
									"Organization with the provided name already exists"
								);
						});
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
					.custom(async (value, { req }) => {
						let orgMember = await orgMemberCtrl.getOneByQuery(
							{
								orgId: req.org._id,
								userId: value,
							},
							{ cacheKey: `${req.org._id}.${value}` }
						);

						if (!orgMember) {
							throw new Error(
								`The user identified with id '${value}' is not a member of organization '${req.org.name}'. Organization ownership can only be transferred to an existing organization member with 'Admin' role.`
							);
						}

						if (orgMember.role !== "Admin") {
							throw new Error(
								"Organization ownership can only be transferred to an existing organization member with 'Admin' role."
							);
						}

						return true;
					}),
			];
		default:
			return [];
	}
};
