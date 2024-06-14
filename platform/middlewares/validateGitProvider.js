import gitCtrl from "../controllers/gitProvider.js";
import helper from "../util/helper.js";

import ERROR_CODES from "../config/errorCodes.js";

export const validateGitProvider = async (req, res, next) => {
	try {
		const { gitProviderId } = req.params;

		// Get the domain object
		let gitProvider = await gitCtrl.getOneById(gitProviderId);

		if (!gitProvider) {
			return res.status(404).json({
				error: "Not Found",
				details: `No such Git provider entry with the provided id '${gitProviderId}' exists.`,
				code: ERROR_CODES.notFound,
			});
		}

		if (gitProvider.userId.toString() !== req.user._id.toString()) {
			return res.status(401).json({
				error: "Not Authorized",
				details: `You do not have a Git provider entry with the provided id '${gitProviderId}'`,
				code: ERROR_CODES.unauthorized,
			});
		}

		// Assign Git provider data
		gitProvider.accessToken = helper.decryptText(gitProvider.accessToken);
		gitProvider.refresnToken = gitProvider.refresnToken
			? helper.decryptText(gitProvider.refresnToken)
			: null;
		req.gitProvider = gitProvider;

		next();
	} catch (err) {
		return helper.handleError(req, res, err);
	}
};

export const validateGitProviderForRefresh = async (req, res, next) => {
	try {
		const { gitProviderId } = req.params;

		// Get the domain object
		let gitProvider = await gitCtrl.getOneById(gitProviderId);

		if (!gitProvider) {
			return res.status(404).json({
				error: "Not Found",
				details: `No such Git provider entry with the provided id '${gitProviderId}' exists.`,
				code: ERROR_CODES.notFound,
			});
		}

		// Assign Git provider data
		req.gitProvider = gitProvider;

		next();
	} catch (err) {
		return helper.handleError(req, res, err);
	}
};
