import {
	checkName,
	checkRepoOrRegistry,
	checkRegistry,
	checkRepo,
	checkVariables,
	checkStorageConfig,
	checkPodConfig,
	checkCronJobConfig,
} from "./checks.js";

export default (actionType) => {
	switch (actionType) {
		case "create":
		case "update":
			return [
				...checkName("cronjob", actionType),
				...checkRepoOrRegistry("cronjob", actionType),
				...checkRegistry("cronjob", actionType),
				...checkRepo("cronjob", actionType),
				...checkVariables("cronjob", actionType),
				...checkStorageConfig("cronjob", actionType),
				...checkPodConfig("cronjob", actionType),
				...checkCronJobConfig("cronjob", actionType),
			];
		default:
			return [];
	}
};
