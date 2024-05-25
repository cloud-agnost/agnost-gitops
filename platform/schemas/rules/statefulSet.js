import {
	checkName,
	checkRepoOrRegistry,
	checkRepo,
	checkVariables,
	checkStorageConfig,
	checkNetworking,
	checkPodConfig,
	checkStatefulSetConfig,
	checkProbes,
} from "./checks.js";

export default (actionType) => {
	switch (actionType) {
		case "create":
		case "update":
			return [
				...checkName("statefulset", actionType),
				...checkRepoOrRegistry("statefulset", actionType),
				...checkRepo("statefulset", actionType),
				...checkVariables("statefulset", actionType),
				...checkStorageConfig("statefulset", actionType),
				...checkNetworking("statefulset", actionType),
				...checkPodConfig("statefulset", actionType),
				...checkStatefulSetConfig("statefulset", actionType),
				...checkProbes("statefulset", actionType),
			];
		default:
			return [];
	}
};
