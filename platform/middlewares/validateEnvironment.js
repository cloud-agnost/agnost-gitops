import prjEnvCtrl from "../controllers/environment.js";

import ERROR_CODES from "../config/errorCodes.js";

export const validateEnvironment = async (req, res, next) => {
	try {
		const { envId } = req.params;

		// Get the environment object
		let environment = await prjEnvCtrl.getOneById(envId, {
			cacheKey: envId,
		});

		if (!environment) {
			return res.status(404).json({
				error: t("Not Found"),
				details: t(
					"No such environment with the provided id '%s' exists.",
					envId
				),
				code: ERROR_CODES.notFound,
			});
		}

		if (req.project._id.toString() !== environment.projectId.toString()) {
			return res.status(401).json({
				error: t("Not Authorized"),
				details: t(
					"Project does not have an environment with the provided id '%s'",
					envId
				),
				code: ERROR_CODES.unauthorized,
			});
		}

		// If this is a private environment then only authorized people can view and update it
		if (environment.private && req.user) {
			if (
				environment.createdBy.toString() !== req.user._id.toString() &&
				req.projectMember.role !== "Admin"
			) {
				return res.status(401).json({
					error: t("Not Authorized"),
					details: t(
						"You do not have the authorization to work on the private environment '%s'",
						environment.name
					),
					code: ERROR_CODES.unauthorized,
				});
			}
		}

		// Assign environment data
		req.environment = environment;

		next();
	} catch (err) {
		return helper.handleError(req, res, err);
	}
};
