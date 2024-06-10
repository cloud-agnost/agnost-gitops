import userCtrl from "../controllers/user.js";
import clsCtrl from "../controllers/cluster.js";
import helper from "../util/helper.js";

import ERROR_CODES from "../config/errorCodes.js";

export const validateCluster = async (req, res, next) => {
	try {
		let user = await userCtrl.getOneByQuery({ isClusterOwner: true });
		if (!user) {
			return res.status(401).json({
				error: "Not Authorized",
				details: "Cluster set up has not been completed yet.",
				code: ERROR_CODES.unauthorized,
			});
		}

		// Get the cluster object
		const cluster = await clsCtrl.getOneByQuery(
			{
				clusterAccesssToken: process.env.CLUSTER_ACCESS_TOKEN,
			},
			{
				cacheKey: process.env.CLUSTER_ACCESS_TOKEN,
			}
		);

		// Assign cluster data
		req.cluster = cluster;

		next();
	} catch (err) {
		return helper.handleError(req, res, err);
	}
};
