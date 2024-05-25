import ERROR_CODES from "../config/errorCodes.js";

// Middleware to handle undefined paths or posts
export const handleUndefinedPaths = (req, res, next) => {
	return res.status(404).json({
		error: t("Not Found"),
		details: t("The server can not find the requested resource."),
		code: ERROR_CODES.resourceNotFound,
	});
};
