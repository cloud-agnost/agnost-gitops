import express from "express";
import ERROR_CODES from "../config/errorCodes.js";

// Middleware to handle undefined paths or posts
export const checkContentType = (req, res, next) => {
	console.log("**here Content-Type", req.get("Content-Type"));
	// Check content type
	if (req.get("Content-Type") !== "application/json") {
		return res.status(415).json({
			error: t("Unsupported Media Type"),
			details: t(
				"The server does not accept the submitted content-type. The content-type should be 'application-json'."
			),
			code: ERROR_CODES.invalidContentType,
		});
	}

	// Parse content and build the req.body object
	express.json({ limit: config.get("server.maxBodySize") })(
		req,
		res,
		(error) => {
			if (error) {
				return res.status(400).json({
					error: t("Invalid Request Body"),
					details: t(
						"The server could not understand the request due to either invalid syntax of JSON document in request body or the request body payload is larger than the allowed limit."
					),
					code: ERROR_CODES.invalidRequestBody,
				});
			}

			next();
		}
	);
};
