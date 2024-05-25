import { body, param } from "express-validator";
import mongoose from "mongoose";
import { orgRoles } from "../config/constants.js";
/**
 * An organization is the top level entitiy used to hold all apps and its associated design elements.
 * Each organization will have team members with different roled. There are two types of roles in Agnost one at the organization level
 * and the other at the application level. The organization level roles specifiy the authorizations an org member have.
 * Org Admin: Full access to the organization, can change organization name and add members to the organization
 * App Admin: Can only manage applications associated with an organization
 * Developer: Developers have read-only access to an organization. They cannot create a new app but can take part as a member to the development of specific apps.
 * Resource Manager: Resource managers can manage organization level resources such as databases, message queuest etc.
 * Viewer: Read-only access to organization information
 */
export const OrganizationMemberModel = mongoose.model(
  "organization_member",
  new mongoose.Schema({
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
      index: true,
      immutable: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      index: true,
      immutable: true,
    },
    role: {
      type: String,
      required: true,
      index: true,
      enum: orgRoles,
    },
    joinDate: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    __v: {
      type: Number,
      select: false,
    },
  })
);

export const applyRules = (type) => {
  switch (type) {
    case "update-member-role":
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
          }),
        body("role")
          .trim()
          .notEmpty()
          .withMessage(t("Required field, cannot be left empty"))
          .bail()
          .isIn(orgRoles)
          .withMessage(t("Unsupported member role")),
      ];
    case "remove-member":
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
          }),
      ];
    case "remove-members":
      return [
        body("userIds")
          .notEmpty()
          .withMessage(t("Required field, cannot be left empty"))
          .isArray()
          .withMessage(t("User identifiers need to be an array of strings")),
        body("userIds.*")
          .trim()
          .notEmpty()
          .withMessage(t("Required field, cannot be left empty"))
          .bail()
          .custom(async (value, { req }) => {
            if (!helper.isValidId(value))
              throw new AgnostError(t("Not a valid user identifier"));

            return true;
          }),
      ];
    default:
      return [];
  }
};
