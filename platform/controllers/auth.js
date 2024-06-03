import config from "config";
import parser from "ua-parser-js";
import helper from "../util/helper.js";
import { setKey, deleteKey, expireKey } from "../init/cache.js";

/**
 * Creates a new session for the user login, returns the sesson access-token and refresh-token
 * @param  {string} email
 * @param  {string} ip IP address of the client
 * @param  {string} userAgent User-agent strng retrieved from request header
 */
const createSession = async (userId, ip, userAgent, provider) => {
	let at = helper.generateSlug("at", 36);
	let rt = helper.generateSlug("rt", 36);
	var ua = parser(userAgent);

	let dtm = new Date();
	// Set access token
	await setKey(
		at,
		{
			userId,
			provider,
			ip,
			createdAt: dtm.toISOString(),
			expiresAt: new Date(
				dtm.valueOf() + config.get("session.accessTokenExpiry") * 1000
			).toISOString(),
			ua,
			rt,
		},
		config.get("session.accessTokenExpiry")
	);

	// Set refresh token
	await setKey(
		rt,
		{
			userId,
			at,
			provider,
			createdAt: dtm.toISOString(),
			expiresAt: new Date(
				dtm.valueOf() + config.get("session.refreshTokenExpiry") * 1000
			).toISOString(),
		},
		config.get("session.refreshTokenExpiry")
	);

	return { at, rt };
};

/**
 * Invalidates (deletes) the session and also associated refresh token
 * @param  {object} session The session object to invalidate
 */
const deleteSession = async (session, immediateDelete = false) => {
	await deleteKey(session.at);
	// We do not immediately delte the refresh token, since there can be parallel request to this refresh token
	if (immediateDelete) {
		await deleteKey(session.rt);
	} else {
		// Just set its expiry to some seconds later
		await expireKey(session.rt, config.get("session.refreshTokenDelete"));
	}
};

export default {
	createSession,
	deleteSession,
};
