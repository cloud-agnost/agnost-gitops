import userCtrl from "../controllers/user.js";
import ERROR_CODES from "../config/errorCodes.js";

export const checkClusterSetupStatus = async (req, res, next) => {
	// Get cluster owner
	let user = await userCtrl.getOneByQuery({ isClusterOwner: true });

	// Check if there is user
	if (user) {
		return res.status(401).json({
			error: t("Not Allowed"),
			details: t(
				"The cluster set up has already been initialized. You cannot reinitialize the set up."
			),
			code: ERROR_CODES.notAllowed,
		});
	}

	next();
};

export const hasClusterSetUpCompleted = async (req, res, next) => {
	// Get cluster owner
	let user = await userCtrl.getOneByQuery({ isClusterOwner: true });

	// Check if there is no cluster owner user
	if (!user) {
		return res.status(401).json({
			error: t("Not Allowed"),
			details: t("The cluster set up has not been completed yet."),
			code: ERROR_CODES.notAllowed,
		});
	}

	next();
};
