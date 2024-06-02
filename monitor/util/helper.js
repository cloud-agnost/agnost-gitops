/**
 * Returns the platform URL based on the current environment.
 * @returns {string} The platform URL.
 */
function getPlatformUrl() {
	return `http://platform.${process.env.NAMESPACE}.svc.cluster.local:4000`;
}

export default {
	getPlatformUrl,
};
