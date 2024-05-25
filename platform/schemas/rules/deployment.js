import {
	checkName,
	checkRepoOrRegistry,
	checkRepo,
	checkVariables,
	checkNetworking,
	checkStorageConfig,
	checkPodConfig,
	checkDeploymentConfig,
	checkProbes,
} from "./checks.js";

export default (actionType) => {
	switch (actionType) {
		case "create":
		case "update":
			return [
				...checkName("deployment", actionType),
				...checkRepoOrRegistry("deployment", actionType),
				...checkRepo("deployment", actionType),
				...checkVariables("deployment", actionType),
				...checkStorageConfig("deployment", actionType),
				...checkNetworking("deployment", actionType),
				...checkPodConfig("deployment", actionType),
				...checkDeploymentConfig("deployment", actionType),
				...checkProbes("deployment", actionType),
			];
		default:
			return [];
	}
};
