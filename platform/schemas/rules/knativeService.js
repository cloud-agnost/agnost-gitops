import {
	checkName,
	checkRepoOrRegistry,
	checkRepo,
	checkVariables,
	checkNetworking,
	checkStorageConfig,
	checkPodConfig,
	checkKnativeServiceConfig,
	checkProbes,
} from "./checks.js";

export default (actionType) => {
	switch (actionType) {
		case "create":
		case "update":
			return [
				...checkName("Knative service", actionType),
				...checkRepoOrRegistry("Knative service", actionType),
				...checkRepo("Knative service", actionType),
				...checkVariables("Knative service", actionType),
				...checkNetworking("Knative service", actionType),
				...checkPodConfig("Knative service", actionType),
				...checkKnativeServiceConfig("Knative service", actionType),
				...checkProbes("Knative service", actionType),
			];
		default:
			return [];
	}
};
