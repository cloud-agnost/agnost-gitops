import mongoose from "mongoose";
import { body } from "express-validator";
import {
	clusterResources,
	clusterComponents,
	clusterComponentStatus,
} from "../config/constants.js";
import configDatabaseRules from "./rules/database.js";
import configCacheRules from "./rules/cache.js";
import configStorageRules from "./rules/storage.js";
import domainCtrl from "../controllers/domain.js";

/**
 * Account is the top level model which will hold the list of organizations, under organization there will be users and apps etc.
 * Whenever a new users signs up a personal account with 'Admin' role will be creted. When a user joins to an organization, a new account entry
 * will be added for the user with the specified role type
 */
export const ClusterModel = mongoose.model(
	"cluster",
	new mongoose.Schema(
		{
			clusterAccesssToken: {
				type: String,
				required: true,
				index: true,
			},
			masterToken: {
				type: String,
				required: true,
				index: true,
			},
			release: {
				type: String,
				required: true,
				index: true,
			},
			// Keeps the release number of the previous releases, whenever the current release is updated, the previous release number is added to this array
			releaseHistory: [
				{
					release: {
						type: String,
						required: true,
					},
					timestamp: { type: Date, default: Date.now, immutable: true },
				},
			],
			clusterResourceStatus: [
				{
					name: {
						type: String,
						required: true,
						enum: [
							...clusterComponents.map((entry) => entry.deploymentName),
							"monitor",
						],
					},
					status: {
						type: String,
						required: true,
						enum: clusterComponentStatus,
					},
					lastUpdateAt: { type: Date, default: Date.now },
				},
			],
			// Custom domains associted with the cluster
			domains: {
				type: [String],
				index: true,
			},
			// Enforce SSL access or not
			enforceSSLAccess: {
				type: Boolean,
				default: false,
			},
			// The ip addresses or hostnames of the cluster
			ips: {
				type: [String],
				index: true,
			},
			createdBy: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "user",
			},
			updatedBy: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "user",
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
		case "update-component":
			return [
				body("deploymentName")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.isIn(clusterComponents.map((entry) => entry.deploymentName))
					.withMessage(t("Unsupported cluster component type")),
				body("hpaName")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.isIn(clusterComponents.map((entry) => entry.hpaName))
					.withMessage(t("Unsupported cluster HPA type")),
				body("replicas")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.isInt({
						min: 1,
					})
					.withMessage(t("Initial replicas needs to be a positive integer"))
					.bail()
					.toInt(),
				body("minReplicas")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.isInt({
						min: 1,
					})
					.withMessage(t("Minimum replicas needs to be a positive integer"))
					.bail()
					.toInt(),
				body("maxReplicas")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.isInt({
						min: 1,
					})
					.withMessage(t("Maximum replicas needs to be a positive integer"))
					.bail()
					.toInt()
					.custom(async (value, { req }) => {
						if (req.body.minReplicas > value)
							throw new AgnostError(
								t("Maximum replicas cannot be smaller than minimum replicas")
							);

						return true;
					}),
			];
		case "update-config":
			return [
				body("type")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.isIn(clusterResources.map((entry) => entry.type))
					.withMessage(t("Unsupported cluster component type")),
				body("instance")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.custom((value, { req }) => {
						let clusterResource = clusterResources.find(
							(entry) => entry.type === req.body.type
						);
						if (!clusterResource)
							throw new AgnostError(
								t(
									"Cannot identify the instance for the provided cluster component type"
								)
							);

						if (value !== clusterResource.instance)
							throw new AgnostError(
								t(
									"Not a valid instance for cluster component type '%s'",
									req.body.type
								)
							);

						return true;
					}),
				...configDatabaseRules(type),
				...configCacheRules(type),
				...configStorageRules(type),
			];
		case "update-version":
			return [
				body("release")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty")),
			];
		case "add-domain":
			return [
				body("domain")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.toLowerCase() // convert the value to lowercase
					.custom((value, { req }) => {
						// The below reges allows for wildcard subdomains
						// const dnameRegex = /^(?:\*\.)?(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
						// Check domain name syntax, we do not currently allow wildcard subdomains
						const dnameRegex = /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
						// Validate domain name (can be at mulitple levels)
						if (!dnameRegex.test(value)) {
							throw new AgnostError(t("Not a valid domain name '%s'", value));
						}

						// Check to see if this domain is already included in the list list or not
						const exists = domainCtrl.getOneByQuery({ domain: value });
						if (exists) {
							throw new AgnostError(
								t(
									"The specified domain '%s' already exists in used domains list",
									value
								)
							);
						}
						return true;
					}),
			];
		case "delete-domain":
			return [
				body("domain")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.toLowerCase() // convert the value to lowercase
					.custom((value, { req }) => {
						// Check to see if this domain is already included in the list
						const { domains } = req.cluster;
						if (domains && domains.find((entry) => entry === value)) {
							return true;
						} else {
							throw new AgnostError(
								t(
									"The specified domain '%s' does not exist in cluster domain list",
									value
								)
							);
						}
					}),
			];
		case "update-enforce-ssl":
			return [
				body("enforceSSLAccess")
					.trim()
					.notEmpty()
					.withMessage(t("Required field, cannot be left empty"))
					.bail()
					.isBoolean()
					.withMessage(t("Not a valid boolean value"))
					.toBoolean(),
			];
		default:
			return [];
	}
};
