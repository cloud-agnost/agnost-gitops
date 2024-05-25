import userCtrl from "../controllers/user.js";
import authCtrl from "../controllers/auth.js";
import { getKey } from "../init/cache.js";
import ERROR_CODES from "../config/errorCodes.js";

export const authSession = async (req, res, next) => {
	// Get token
	let token = req.header("Authorization") ?? req.query.token;

	// Check if there is token
	if (!token) {
		return res.status(401).json({
			error: t("Unauthorized"),
			details: t("No access token was found in 'Authorization' header."),
			code: ERROR_CODES.missingAccessToken,
		});
	}

	// Check if this is a valid session token, session tokens have refresh tokens
	let session = await getKey(token);
	if (!session || !session.rt) {
		// Check if there is refresh token in header, the session token might be expired but if we have a refresh token in header we can use it to renew the access token
		let refreshToken = req.header("Refresh-Token");
		if (refreshToken) {
			// Check if token is still valid or not
			let refreshTokenObj = await getKey(refreshToken);
			if (refreshTokenObj) {
				// First delete existing access and refresh tokens
				await authCtrl.deleteSession({ at: token, rt: refreshToken });
				// Create new session
				let tokens = await authCtrl.createSession(
					refreshTokenObj.userId,
					helper.getIP(req),
					req.headers["user-agent"]
				);

				// Get the new session object
				session = await getKey(tokens.at);

				if (!session) {
					return res.status(401).json({
						error: t("Unauthorized"),
						details: t("The access token was not authorized or has expired."),
						code: ERROR_CODES.invalidSession,
					});
				} else {
					res.setHeader("Access-Token", tokens.at);
					res.setHeader("Refresh-Token", tokens.rt);
				}
			} else {
				return res.status(401).json({
					error: t("Unauthorized"),
					details: t("The access token was not authorized or has expired."),
					code: ERROR_CODES.invalidSession,
				});
			}
		} else {
			return res.status(401).json({
				error: t("Unauthorized"),
				details: t("The access token was not authorized or has expired."),
				code: ERROR_CODES.invalidSession,
			});
		}
	}

	// Get the user information associated with the session
	let user = await userCtrl.getOneById(session.userId, {
		cacheKey: session.userId,
	});

	if (!user || user.status !== "Active") {
		return res.status(403).json({
			error: t("Unauthorized"),
			details: t("No such user exists or the user account is not active."),
			code: ERROR_CODES.invalidUser,
		});
	}

	req.user = user;
	req.session = { ...session, at: token };
	next();
};
