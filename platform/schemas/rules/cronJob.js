import {
	checkName,
	checkRepoOrRegistry,
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
				...checkName("cron job", actionType),
				...checkRepoOrRegistry("cron job", actionType),
				...checkRepo("cron job", actionType),
				...checkVariables("cron job", actionType),
				...checkStorageConfig("cron job", actionType),
				...checkPodConfig("cron job", actionType),
				...checkCronJobConfig("cron job", actionType),
			];
		default:
			return [];
	}
};
