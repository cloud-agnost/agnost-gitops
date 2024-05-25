import mongoose from "mongoose";

/**
 * Keeps information about the custom domains added to the containers or cluster itself. This is used to prevent duplicate domain names and creation of conflicting ingress rules.
 */
export const DomainModel = mongoose.model(
	"domain",
	new mongoose.Schema(
		{
			domain: {
				type: String,
				required: true,
				index: true,
			},
			__v: {
				type: Number,
				select: false,
			},
		},
		{ timestamps: true }
	)
);
