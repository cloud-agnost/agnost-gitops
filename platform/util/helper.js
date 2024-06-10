import mongoose from "mongoose";
import net from "net";
import randomColor from "randomcolor";
import { customAlphabet } from "nanoid";
import cyripto from "crypto-js";
import ERROR_CODES from "../config/errorCodes.js";

// This module contains helper functions and constant definitiosn that are used across the application.

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
		console.error(err);
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
 * Generates a hihg probability unique secret vallue
 * @param  {string} length The length of the secret
 */
function generateSecret(length) {
	// Kubernetes resource names need to be alphanumeric and in lowercase letters
	const alphabet =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const nanoid = customAlphabet(alphabet, length);
	return nanoid();
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
		console.error(err);
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

	// 127.x.x.x (loopback address)
	if (parts[0] === 127) {
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
	return `http://sync.${process.env.NAMESPACE}.svc.cluster.local:4000`;
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
	return text.replace(/[|\\{}()[\]^$+*?./]/g, "\\$&").replace(/-/g, "\\x2d");
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
		if (error.response?.body?.message) {
			return res.status(400).json({
				error: "Bad Request",
				details: error.response?.body?.message,
				code: ERROR_CODES.badRequest,
				stack: error.stack,
			});
		}

		if (error?.response?.data?.status === "error") {
			return res.status(500).json({
				error: "Internal Server Error",
				details: error.response.data.message,
				code: ERROR_CODES.internalServerError,
				stack: error.response.data.stack,
			});
		}

		if (error.name === "CastError") {
			entry.error = "Not Found";
			entry.details = "The object identifier is not recognized.";
			res.status(400).json(entry);
		} else {
			entry.error = "Internal Server Error";
			entry.details = `The server has encountered a situation it does not know how to handle. ${error.message}`;
			res.status(500).json(entry);
		}
	}

	// Log also the error message in console
	console.info(JSON.stringify(entry, null, 2));
}

/**
 * Sleeps for the specified number of milliseconds.
 * @param {number} ms - The number of milliseconds to sleep.
 * @returns {Promise<void>} - A promise that resolves after the specified number of milliseconds.
 */
export function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export default {
	constants,
	getIP,
	generateColor,
	generateSlug,
	generateSecret,
	getCertSecretName,
	generateId,
	objectId,
	isValidId,
	encryptText,
	decryptText,
	encyrptSensitiveData,
	decryptSensitiveData,
	isPrivateIP,
	getSyncUrl,
	escapeStringRegexp,
	handleError,
	sleep,
};
