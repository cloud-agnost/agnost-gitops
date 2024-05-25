import gitCtrl from "../controllers/gitProvider.js";

import ERROR_CODES from "../config/errorCodes.js";
import helper from "../util/helper.js";

export const validateGitProvider = async (req, res, next) => {
	try {
		const { gitProviderId } = req.params;

		// Get the domain object
		let gitProvider = await gitCtrl.getOneById(gitProviderId);

		if (!gitProvider) {
			return res.status(404).json({
				error: t("Not Found"),
				details: t(
					"No such Git provider entry with the provided id '%s' exists.",
					gitProviderId
				),
				code: ERROR_CODES.notFound,
			});
		}

		if (gitProvider.userId.toString() !== req.user._id.toString()) {
			return res.status(401).json({
				error: t("Not Authorized"),
				details: t(
					"You do not have a Git provider entry with the provided id '%s'",
					gitProviderId
				),
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
