import { validationResult } from "express-validator";
import ERROR_CODES from "../config/errorCodes.js";

// Middleare the create the error message for failed request input validations
export const validate = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({
			error: t("Invalid Input"),
			details: t(
				"The request parameters has failed to pass the validation rules."
			),
			code: ERROR_CODES.validationError,
			fields: errors.array(),
		});
	}

	next();
};
