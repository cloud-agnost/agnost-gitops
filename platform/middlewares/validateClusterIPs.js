import helper from "../util/helper.js";
import ERROR_CODES from "../config/errorCodes.js";

// Checks whether the cluster ips are private or not. Before this middleware the validateCluster middleware is used to validate the cluster
export const validateClusterIPs = async (req, res, next) => {
	try {
		const clusterIPs = req.cluster.ips;
		for (let i = 0; i < clusterIPs.length; i++) {
			// Means that there is at least one IP address that is not private
			if (helper.isPrivateIP(clusterIPs[i]) === false) {
				return next();
			}
		}

		return res.status(401).json({
			error: "Not Allowed",
			details: `Your cluster IP addresses '${clusterIPs.join(
				", "
			)}' are private IP addresses which are not routable on the internet. You cannot use private IP addresses to access the platform.`,
			code: ERROR_CODES.notAllowed,
		});
	} catch (err) {
		return helper.handleError(req, res, err);
	}
};
