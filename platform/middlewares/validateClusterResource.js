import { clusterResources } from "../config/constants.js";
import { ClusterManager } from "../cluster/clusterManager.js";

import ERROR_CODES from "../config/errorCodes.js";

// Checks whether the component name matches to one of the cluster resources (e.g., mongodb, redis, etc.)
export const validateClusterResource = async (req, res, next) => {
	try {
		const { componentName } = req.params;

		if (!clusterResources.map((entry) => entry.name).includes(componentName)) {
			return res.status(404).json({
				error: t("Not Found"),
				details: t(
					"No such cluster component with the provided name '%s' exists.",
					componentName
				),
				code: ERROR_CODES.notFound,
			});
		}

		let manager = new ClusterManager();
		const clusterInfo = await manager.getClusterInfo();

		const resInfo = clusterInfo.find((entry) => entry.name === componentName);
		if (!resInfo) {
			return res.status(404).json({
				error: t("Not Found"),
				details: t(
					"No such cluster component with the provided name '%s' exists.",
					componentName
				),
				code: ERROR_CODES.notFound,
			});
		}

		const metaInfo = clusterResources.find(
			(entry) => entry.name === componentName
		);

		// Assign resource data
		req.body.name = metaInfo.k8sName;
		req.body.type = metaInfo.type;
		req.body.instance = metaInfo.instance;
		req.resource = {
			name: componentName,
			managed: true,
			config: {
				replicas: resInfo.info.configuredReplicas,
				size: resInfo.info.pvcSize,
			},
		};

		req.resInfo = resInfo;

		next();
	} catch (err) {
		return helper.handleError(req, res, err);
	}
};
