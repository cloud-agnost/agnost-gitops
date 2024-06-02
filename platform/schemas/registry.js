import mongoose from "mongoose";
import { registryTypes } from "../config/constants.js";

/**
 * The definition for a private image registries where Docker images are stored and retrieved from.
 */
export const RegistryModel = mongoose.model(
	"registry",
	new mongoose.Schema(
		{
			iid: {
				// Internal identifier
				type: String,
				required: true,
				index: true,
				immutable: true,
			},
			type: {
				type: String,
				required: true,
				index: true,
				immutable: true,
				enum: registryTypes,
			},
			name: {
				type: String,
				required: true,
				index: true,
			},
			ecr: {
				username: {
					type: String,
				},
				password: {
					type: String,
				},
				accessKeyId: {
					type: String,
				},
				secretAccessKey: {
					type: String,
				},
				accountId: {
					type: String,
				},
				region: {
					type: String,
				},
			},
			acr: {
				username: {
					type: String,
				},
				password: {
					type: String,
				},
				registryName: {
					type: String,
				},
			},
			gcp: {
				username: {
					type: String,
				},
				password: {
					type: String,
				},
				region: {
					type: String,
				},
			},
			generic: {
				username: {
					type: String,
				},
				password: {
					type: String,
				},
			},
			createdBy: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "user",
			},
			updatedBy: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "user",
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
