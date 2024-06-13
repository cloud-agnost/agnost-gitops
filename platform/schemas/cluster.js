import mongoose from "mongoose";
import { body, query } from "express-validator";
import domainCtrl from "../controllers/domain.js";
import cntrCtrl from "../controllers/container.js";

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
			slug: {
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
			// Custom domains associted with the cluster
			domains: {
				type: [String],
				index: true,
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
		case "get-template":
			return [
				query("name")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty"),
				query("version")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty"),
			];
		case "update-version":
			return [
				body("release")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty"),
			];
		case "add-domain":
			return [
				body("domain")
					.trim()
					.notEmpty()
					.withMessage("Required field, cannot be left empty")
					.bail()
					.toLowerCase() // convert the value to lowercase
					.custom(async (value) => {
						const dnameRegex = /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
						// Validate domain name (can be at mulitple levels)
						if (!dnameRegex.test(value)) {
							throw new Error(`Not a valid domain name '${value}'`);
						}

						// Check to see if this domain is already included in the list list or not
						const exists = await domainCtrl.getOneByQuery({ domain: value });
						if (exists) {
							throw new Error(
								"The specified domain '${value}' already exists in used domains list"
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
					.withMessage("Required field, cannot be left empty")
					.bail()
					.toLowerCase() // convert the value to lowercase
					.custom(async (value, { req }) => {
						// Check to see if this domain is already included in the list
						const { domains } = req.cluster;
						if (domains && domains.find((entry) => entry === value)) {
							let containers = await cntrCtrl.getManyByQuery({
								"networking.ingress.enabled": true,
								"networking.ingress.type": "subdomain",
							});

							if (containers.length > 0) {
								throw new Error(
									`There are total of ${containers.length} containers that are using a subdomain of this cluster domain in their ingress definitions. You need to disable the ingress setting for these containers before deleting the cluster domain.`
								);
							}

							containers = await cntrCtrl.getManyByQuery({
								repoOrRegistry: "repo",
								"repo.connected": true,
								"repo.webHookId": { $exists: true },
							});

							if (containers.length > 0) {
								throw new Error(
									`There are total of ${containers.length} containers that are using this cluster domain in their git repo webhooks. You need to disconnect the repos of these containers before deleting the cluster domain.`
								);
							}

							return true;
						} else {
							throw new Error(
								`The specified domain '${value}' does not exist in cluster domain list`
							);
						}
					}),
			];
		default:
			return [];
	}
};
