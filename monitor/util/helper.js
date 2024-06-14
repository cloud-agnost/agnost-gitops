import cyripto from "crypto-js";

/**
 * Returns the platform URL based on the current environment.
 * @returns {string} The platform URL.
 */
function getPlatformUrl() {
	return `http://platform.${process.env.NAMESPACE}.svc.cluster.local:4000`;
}

/**
 * Decrypts the encrypted text and returns the decrypted string value
 * @param  {string} ciphertext The encrypted input text
 */
function decryptText(cipherText) {
	const bytes = cyripto.AES.decrypt(cipherText, process.env.PASSPHRASE);
	return bytes.toString(cyripto.enc.Utf8);
}

export default {
	getPlatformUrl,
	decryptText,
};
