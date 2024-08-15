import axios from "axios";
import config from "config";
import { getDBClient } from "../init/db.js";
import helper from "../util/helper.js";

/**
 * Monitors the status of git provider access tokens in the cluster and refreshes the ones that are close to their expiry.
 * @returns {Promise<void>} A promise that resolves when the monitoring is complete.
 */
export async function monitorAccessTokens() {
	try {
		let pageNumber = 0;
		let pageSize = config.get("general.gitProviderPaginationSize");
		const now = new Date();
		const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);

		let gitProviders = await getGitProviders(
			tenMinutesLater,
			pageNumber,
			pageSize
		);

		while (gitProviders && gitProviders.length) {
			for (let i = 0; i < gitProviders.length; i++) {
				const gitProvider = gitProviders[i];
				// Refresh the access token
				await refreshAccessToken(gitProvider);
			}

			// Interate to the next page
			pageNumber++;
			gitProviders = await getGitProviders(
				tenMinutesLater,
				pageNumber,
				pageSize
			);
		}
	} catch (err) {
		console.error(`Cannot fetch git providers. ${err}`);
	}
}

/**
 * Returns the list of git providers (gitlab, bitbucket) from the cluster database whose access tokens need to be refreshed.
 * @param  {number} pageNumber Curent page number (used for pagination)
 * @param  {number} pageSize The records per page
 */
async function getGitProviders(tenMinutesLater, pageNumber, pageSize) {
	let dbClient = getDBClient();

	return await dbClient
		.db("agnost")
		.collection("git_providers")
		.find(
			{
				provider: { $in: ["gitlab", "bitbucket"] },
				accessToken: { $exists: true },
				refreshToken: { $exists: true },
				expiresAt: { $lte: tenMinutesLater },
			},
			{ skip: pageNumber * pageSize, limit: pageSize }
		)
		.toArray();
}

async function refreshAccessToken(gitProvider) {
	try {
		// Renew the access and refresh tokens
		const response = await axios.post(
			`https://api.agnost.dev/oauth/${gitProvider.provider}/refresh`,
			{ refreshToken: helper.decryptText(gitProvider.refreshToken) }
		);

		const { accessToken, refreshToken, expiresAt } = response.data;
		let date = new Date(expiresAt * 1000);
		date = isNaN(date.getTime()) ? null : date;

		// Make api call to the platform to update the access and refresh tokens
		axios
			.post(
				helper.getPlatformUrl() + `/v1/user/git/${gitProvider._id}/refresh`,
				{
					accessToken: accessToken,
					refreshToken: refreshToken,
					expiresAt: date,
				},
				{
					headers: {
						Authorization: process.env.MASTER_TOKEN,
						"Content-Type": "application/json",
					},
				}
			)
			.then(() => {
				console.info(
					`Refreshed access token for ${gitProvider.provider} provider account ${gitProvider.username}:${gitProvider.email}.`
				);
			})
			.catch((err) => {
				console.error(
					`Cannot send refreshed access and refresh tokens data to platform. ${JSON.stringify(
						err.response?.data
					)}`
				);
			});
	} catch (err) {
		console.error(
			`Cannot refresh access token for ${
				gitProvider.provider
			} provider account ${gitProvider.username}:${
				gitProvider.email
			}. ${JSON.stringify(err.response?.data)}`
		);
	}
}
