import axios from "axios";
import mongoose from "mongoose";
import net from "net";
import randomColor from "randomcolor";
import { customAlphabet } from "nanoid";
import cyripto from "crypto-js";
import tcpProxyPortCtrl from "../controllers/tcpProxyPort.js";
import { getKey, setKey, incrementKey } from "../init/cache.js";

const constants = {
	"1hour": 3600, // in seconds
	"2hours": 7200, // in seconds
	"1day": 86400, // in seconds
	"1week": 604800, // in seconds
	"1month": 2592000, // in seconds (30 days)
	"3months": 7776000, // in seconds (90 days)
	"6months": 15552000, // in seconds (180 days)
	"1year": 31536000, // in seconds (365 days)
};

/**
 * Get the IP number of requesting client
 * @param  {object} req HTTP request object
 */
function getIP(req) {
	try {
		var ip;
		if (req.headers["x-forwarded-for"]) {
			ip = req.headers["x-forwarded-for"].split(",")[0];
		} else if (req.connection && req.connection.remoteAddress) {
			ip = req.connection.remoteAddress;
		} else {
			ip = req.ip;
		}

		return ip;
	} catch (err) {
		return req.ip ?? null;
	}
}

/**
 * Generates a random color for avatar backgrounds
 */
function generateColor(luminosity = "dark") {
	return randomColor({ luminosity });
}

/**
 * Generates a hihg probability unique slugs
 * @param  {string} prefix The prefix prepended to the slug
 * @param  {string} length The length of the slug excluding the prefix
 */
function generateSlug(prefix, length = 12) {
	// Kubernetes resource names need to be alphanumeric and in lowercase letters
	const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
	const nanoid = customAlphabet(alphabet, length);
	return `${prefix}-${nanoid()}`;
}

/**
 * Generate a new unique MongoDB identifier
 */
function generateId() {
	return new mongoose.Types.ObjectId().toString();
}

/**
 * Returns an ObjectId object
 * @param  {string} idString The string representation of the id
 */
function objectId(idString) {
	return new mongoose.Types.ObjectId(idString);
}

/**
 * Checks if the id is a valid MongoDB identifer or not
 * @param  {string} id The identifer to check
 */
function isValidId(id) {
	if (!id) return false;

	try {
		if (mongoose.Types.ObjectId.isValid(id)) {
			if (mongoose.Types.ObjectId(id).toString() === id.toString()) {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	} catch (err) {
		return false;
	}
}

/**
 * Encrypts the input text and returns the encrypted string value
 * @param  {string} text The input text to encrypt
 */
function encryptText(text) {
	return cyripto.AES.encrypt(text, process.env.PASSPHRASE).toString();
}

/**
 * Decrypts the encrypted text and returns the decrypted string value
 * @param  {string} ciphertext The encrypted input text
 */
function decryptText(cipherText) {
	const bytes = cyripto.AES.decrypt(cipherText, process.env.PASSPHRASE);
	return bytes.toString(cyripto.enc.Utf8);
}

/**
 * Encrtypes sensitive connection data
 * @param  {Object} access The connection settings needed to connect to the resource
 */
function encyrptSensitiveData(access) {
	if (Array.isArray(access)) {
		let list = [];
		access.forEach((entry) => {
			list.push(encyrptSensitiveData(entry));
		});

		return list;
	}

	let encrypted = {};
	for (const key in access) {
		const value = access[key];
		if (Array.isArray(value)) {
			encrypted[key] = value.map((entry) => {
				if (entry && typeof entry === "object")
					return encyrptSensitiveData(entry);
				if (entry && typeof entry === "string") return encryptText(entry);
				else return entry;
			});
		} else if (typeof value === "object" && value !== null) {
			encrypted[key] = encyrptSensitiveData(value);
		} else if (value && typeof value === "string")
			encrypted[key] = encryptText(value);
		else encrypted[key] = value;
	}

	return encrypted;
}

/**
 * Decrypt connection data
 * @param  {Object} access The encrypted connection settings needed to connect to the resource
 */
function decryptSensitiveData(access) {
	if (Array.isArray(access)) {
		let list = [];
		access.forEach((entry) => {
			list.push(decryptSensitiveData(entry));
		});

		return list;
	}

	let decrypted = {};
	for (const key in access) {
		const value = access[key];
		if (Array.isArray(value)) {
			decrypted[key] = value.map((entry) => {
				if (entry && typeof entry === "object")
					return decryptSensitiveData(entry);
				if (entry && typeof entry === "string") return decryptText(entry);
				else return entry;
			});
		} else if (typeof value === "object" && value !== null) {
			decrypted[key] = decryptSensitiveData(value);
		} else if (value && typeof value === "string")
			decrypted[key] = decryptText(value);
		else decrypted[key] = value;
	}

	return decrypted;
}

/**
 * Helper function to convert memory string to bytes
 * @param  {string} memoryStr Memory size such as 500Mi or 1Gi
 */
function memoryToBytes(memoryStr) {
	const value = parseInt(memoryStr, 10);

	if (memoryStr.endsWith("Mi")) {
		return value * Math.pow(2, 20); // Convert mebibytes to bytes
	}

	if (memoryStr.endsWith("Gi")) {
		return value * Math.pow(2, 30); // Convert gibibytes to bytes
	}
}

/**
 * Checks if the given IP address is a private IP address which are not routable on the internet.
 * Private IP addresses include:
 * - 10.x.x.x
 * - 172.16.x.x - 172.31.x.x
 * - 192.168.x.x
 * - Unique local addresses in IPv6 (fc00::/7)
 *
 * @param {string} ip - The IP address to check.
 * @returns {boolean} Returns true if the IP address is private, otherwise returns false.
 */
function isPrivateIP(ip) {
	const parts = ip.split(".").map((part) => parseInt(part, 10));

	// Check for IPv4 private addresses
	// 10.x.x.x
	if (parts[0] === 10) {
		return true;
	}
	// 172.16.x.x - 172.31.x.x
	if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
		return true;
	}
	// 192.168.x.x
	if (parts[0] === 192 && parts[1] === 168) {
		return true;
	}

	// If IPv6, check for unique local addresses (fc00::/7)
	if (net.isIPv6(ip)) {
		const firstHex = parseInt(ip.substring(0, 4), 16);
		if (firstHex >= 0xfc00 && firstHex < 0xfe00) {
			return true;
		}
	}

	return false;
}

function getSyncUrl() {
	return `http://platform-sync-clusterip-service.${process.env.NAMESPACE}.svc.cluster.local:4000`;
}

/**
 * Escapes special characters in a string to be used in a regular expression.
 *
 * @param {string} text - The input string to escape.
 * @returns {string} The escaped string.
 */
function escapeStringRegexp(text) {
	// Escape characters with special meaning either inside or outside character sets.
	// Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
	return text.replace(/[|\\{}()[\]^$+*?.\/]/g, "\\$&").replace(/-/g, "\\x2d");
}

/**
 * Checks if the provided access token is valid for the given Git provider.
 *
 * @param {string} accessToken - The access token to be validated.
 * @param {string} gitProvider - The Git provider (e.g., "github").
 * @returns {Promise<Object>} - A promise that resolves to an object containing the validation result.
 * @throws {Error} - If an error occurs during the validation process.
 */
async function isValidGitProviderAccessToken(accessToken, gitProvider) {
	if (gitProvider === "github") {
		try {
			const result = await axios.get("https://api.github.com/user", {
				headers: { Authorization: `token ${accessToken}` },
			});

			const email = await getGitHubUserEmail(accessToken);

			return {
				valid: true,
				user: {
					providerUserId: result.data.id.toString(),
					username: result.data.login,
					email: email,
					avatar: result.data.avatar_url,
					provider: gitProvider,
				},
			};
		} catch (error) {
			if (error.response && error.response.status === 401) {
				return { valid: false, error: t("Invalid or expired token.") }; // Token is invalid
			} else {
				return { valid: false, error: error.message }; // Other errors
			}
		}
	}
	return { valid: false, error: t("Unsupported Git repository provider.") };
}

/**
 * Retrieves the primary email address associated with the GitHub user.
 * @param {string} accessToken - The access token for authenticating the request.
 * @returns {Promise<string|null>} The primary email address of the GitHub user, or null if not found.
 */
async function getGitHubUserEmail(accessToken) {
	try {
		let result = await axios.get("https://api.github.com/user/emails", {
			headers: {
				Accept: "application/vnd.github.v3+json",
				"User-Agent": "OAuth App",
				Authorization: `token ${accessToken}`,
			},
		});

		if (result.data) {
			for (let i = 0; i < result.data.length; i++) {
				const emeilEntry = result.data[i];
				if (emeilEntry && emeilEntry.primary && emeilEntry.email)
					return emeilEntry.email;
			}
		}

		return null;
	} catch (err) {}

	return null;
}

/**
 * Revokes the access token and refresh token for a given Git provider.
 *
 * @param {string} provider - The Git provider name.
 * @param {string} accessToken - The access token to be revoked.
 * @param {string} refreshToken - The refresh token to be revoked.
 * @returns {Promise<void>} - A Promise that resolves when the tokens are revoked.
 */
async function revokeGitProviderAccessToken(
	provider,
	accessToken,
	refreshToken
) {
	try {
		await axios.post(
			`https://auth.agnost.dev/provider/${provider}/revoke`,
			{ accessToken, refreshToken },
			{
				headers: {
					Accept: "application/vnd.github.v3+json",
					"User-Agent": "OAuth App",
					Authorization: `token ${accessToken}`,
				},
			}
		);
	} catch (err) {}
}

/**
 * Fetches all pages of data from the specified URL used to fetch git repositories.
 *
 * @param {string} url - The URL to fetch the data from.
 * @param {object} config - The configuration object for the request.
 * @returns {Promise<Array>} - A promise that resolves to an array of fetched data.
 */
async function fetchAllPages(url, config) {
	let results = [];
	let page = 1;
	let moreData = true;

	while (moreData) {
		const response = await axios.get(
			`${url}?page=${page}&per_page=100`,
			config
		);
		if (response.data.length > 0) {
			results = results.concat(response.data);
			page++;
		} else {
			moreData = false;
		}
	}

	return results;
}

/**
 * Retrieves the repositories of a given Git provider.
 *
 * @param {Object} gitProvider - The Git provider object.
 * @param {string} gitProvider.provider - The name of the Git provider (e.g., "github").
 * @param {string} gitProvider.accessToken - The access token for the Git provider.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of repository objects.
 */
async function getGitProviderRepos(gitProvider) {
	if (gitProvider.provider === "github") {
		try {
			const config = {
				headers: {
					Authorization: `Bearer ${gitProvider.accessToken}`,
					"X-GitHub-Api-Version": "2022-11-28",
				},
			};

			const userRepos = await fetchAllPages(
				"https://api.github.com/user/repos",
				config
			);

			const userReposData = userRepos.map((entry) => ({
				repoId: entry.id,
				owner: entry.owner.login,
				repo: entry.name,
				fullName: entry.full_name,
				private: entry.private,
				url: entry.html_url,
			}));

			return userReposData;
		} catch (error) {
			return [];
		}
	}
}

/**
 * Retrieves the branches of a repository from a Git provider.
 *
 * @param {Object} gitProvider - The Git provider object.
 * @param {string} gitProvider.provider - The name of the Git provider (e.g., "github").
 * @param {string} gitProvider.accessToken - The access token for the Git provider.
 * @param {string} owner - The owner of the repository.
 * @param {string} repo - The name of the repository.
 * @param {number} [maxPages=100] - The maximum number of pages to retrieve.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of branch objects.
 * Each branch object has a `name` property representing the branch name and a `protected` property indicating if the branch is protected.
 */
async function getGitProviderRepoBranches(
	gitProvider,
	owner,
	repo,
	maxPages = 100
) {
	if (gitProvider.provider === "github") {
		try {
			let url = `https://api.github.com/repos/${owner}/${repo}/branches?per_page=${maxPages}`;
			const branches = [];
			let pageCount = 0;

			while (url && pageCount < maxPages) {
				const response = await axios.get(url, {
					headers: {
						Authorization: `Bearer ${gitProvider.accessToken}`,
						Accept: "application/vnd.github.v3+json",
					},
				});

				response.data.forEach((branch) => {
					branches.push({ name: branch.name, protected: branch.protected });
				});

				const linkHeader = response.headers.link;
				if (linkHeader) {
					const matches = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
					url = matches ? matches[1] : null;
				} else {
					url = null; // No more pages
				}

				pageCount++;
			}

			return branches;
		} catch (error) {
			return [];
		}
	}
}

/**
 * Retrieves a new TCP port number.
 * If a key-value pair for "agnost_tcp_proxy_port_number" exists, it returns the latest port number.
 * If not, it checks the database for the latest port number. If found, it sets the latest port number in cache.
 * If not found, it sets the key-value pair to the value specified in the configuration.
 * It then increments the key-value pair by 1 and saves the new port number to the database.
 * @returns {Promise<number>} The new TCP port number.
 */
async function getNewTCPPortNumber() {
	// First check if we have key value
	const latestPortNumber = await getKey("agnost_tcp_proxy_port_number");
	// Ok we do not have it set it to the latest value
	if (!latestPortNumber) {
		// First check if we have a database entry
		const entry = await tcpProxyPortCtrl.getOneByQuery(
			{},
			{ sort: { port: "desc" } }
		);

		if (entry) {
			// Set the latest port number to the latest value
			await setKey("agnost_tcp_proxy_port_number", entry.port);
		} else {
			// Set the latest port number to the latest value
			await setKey(
				"agnost_tcp_proxy_port_number",
				config.get("general.tcpProxyPortStart")
			);
		}
	}

	const newPortNumber = await incrementKey("agnost_tcp_proxy_port_number", 1);
	// Save new port number to database
	await tcpProxyPortCtrl.create({ port: newPortNumber });
	return newPortNumber;
}

/**
 * Handles errors and sends appropriate response to the client.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Error} error - The error object.
 * @returns {void}
 */
function handleError(req, res, error) {
	let entry = {
		code: ERROR_CODES.internalServerError,
		name: error.name,
		message: error.message,
		stack: error.stack,
	};

	if (!res.headersSent) {
		if (error?.response?.data?.status === "error") {
			return res.status(500).json({
				error: t("Internal Server Error"),
				details: error.response.data.message,
				code: ERROR_CODES.internalServerError,
				stack: error.response.data.stack,
			});
		}

		if (error.name === "CastError") {
			entry.error = t("Not Found");
			entry.details = t("The object identifier is not recognized.");
			res.status(400).json(entry);
		} else {
			entry.error = t("Internal Server Error");
			entry.details = t(
				"The server has encountered a situation it does not know how to handle. %s",
				error.message
			);
			res.status(500).json(entry);
		}
	}

	// Log also the error message in console
	logger.info(JSON.stringify(entry, null, 2));
}

/**
 * Generates a secret name for a certificate.
 * @param {number} [length=12] - The length of the secret name. Default is 12.
 * @returns {string} - The generated secret name.
 */
function getCertSecretName(length = 12) {
	// Kubernetes resource names need to be alphanumeric and in lowercase letters
	const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
	const nanoid = customAlphabet(alphabet, length);
	return `cert-secret-${nanoid()}`;
}

export default {
	constants,
	isObject,
	isEmptyJson,
	getIP,
	generateColor,
	generateSlug,
	generatePassword,
	generateUsername,
	generateId,
	objectId,
	isValidId,
	getDateStr,
	appendQueryParams,
	encryptText,
	decryptText,
	encyrptSensitiveData,
	decryptSensitiveData,
	isValidDomain,
	isValidIPAddress,
	getQueryString,
	getAsObject,
	memoryToBytes,
	isPrivateIP,
	decryptVersionData,
	decryptResourceData,
	getTypedValue,
	getSyncUrl,
	getRealtimeUrl,
	getPlatformUrl,
	getWorkerUrl,
	escapeStringRegexp,
	highlight,
	isValidGitProviderAccessToken,
	getGitHubUserEmail,
	revokeGitProviderAccessToken,
	getGitProviderRepos,
	getGitProviderRepoBranches,
	getNewTCPPortNumber,
	handleError,
	getCertSecretName,
};
