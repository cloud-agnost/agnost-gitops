import cntrCtrl from "../controllers/container.js";
import helper from "../util/helper.js";

import ERROR_CODES from "../config/errorCodes.js";

export const validateContainer = async (req, res, next) => {
	try {
		const { containerId } = req.params;

		// Get the container object
		let container = await cntrCtrl.getOneById(containerId, {
			cacheKey: containerId,
		});

		if (!container) {
			return res.status(404).json({
				error: "Not Found",
				details: `No such container with the provided id '${containerId}' exists.`,
				code: ERROR_CODES.notFound,
			});
		}

		if (container.environmentId.toString() !== req.environment._id.toString()) {
			return res.status(401).json({
				error: "Not Authorized",
				details: `Project environment does not have a container with the provided id '${containerId}'`,
				code: ERROR_CODES.unauthorized,
			});
		}

		// Assign container data
		req.container = container;

		next();
	} catch (err) {
		return helper.handleError(req, res, err);
	}
};
