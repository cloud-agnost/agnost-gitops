import clsCtrl from "../controllers/cluster.js";
import { getClusterIPs } from "../handlers/cluster.js";
import helper from "../util/helper.js";

import ERROR_CODES from "../config/errorCodes.js";

// Checks whether the cluster ips are private or not. Before this middleware the validateCluster middleware is used to validate the cluster
export const validateClusterIPs = async (req, res, next) => {
	return next();
	try {
		let clusterIPs = req.cluster.ips;
		// If the cluster ips are not available in the database, fetch them and update the cluster object
		if (clusterIPs?.length === 0) {
			clusterIPs = await getClusterIPs(req.cluster.name);

			if (clusterIPs.length > 0) {
				await clsCtrl.updateOneById(
					req.cluster._id,
					{ ips: clusterIPs },
					{},
					{ cacheKey: req.cluster.clusterAccessToken }
				);
			}
		}

		if (clusterIPs.length === 0) {
			return res.status(401).json({
				error: "Not Allowed",
				details: `Cluster IP address(es) cannot be identified through the ingress resource.`,
				code: ERROR_CODES.notAllowed,
			});
		}

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
