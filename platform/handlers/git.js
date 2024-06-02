import axios from "axios";

/**
 * Checks if the provided access token is valid for the given Git provider.
 *
 * @param {string} accessToken - The access token to be validated.
 * @param {string} gitProvider - The Git provider (e.g., "github").
 * @returns {Promise<Object>} - A promise that resolves to an object containing the validation result.
 * @throws {Error} - If an error occurs during the validation process.
 */
export async function isValidGitProviderAccessToken(accessToken, gitProvider) {
	if (gitProvider === "github") {
		try {
			const result = await axios.get("https://api.github.com/user", {
				headers: { Authorization: `token ${accessToken}` },
			});

			const email = await getGitHubUserEmail(accessToken);

			return {
				valid: true,
				user: {
					providerUserId: result.data.id.toString(),
					username: result.data.login,
					email: email,
					avatar: result.data.avatar_url,
					provider: gitProvider,
				},
			};
		} catch (error) {
			if (error.response && error.response.status === 401) {
				return { valid: false, error: t("Invalid or expired token.") }; // Token is invalid
			} else {
				return {
					valid: false,
					error: error.response?.body?.message ?? error.message,
				}; // Other errors
			}
		}
	}
	return { valid: false, error: t("Unsupported Git repository provider.") };
}

/**
 * Retrieves the primary email address associated with the GitHub user.
 * @param {string} accessToken - The access token for authenticating the request.
 * @returns {Promise<string|null>} The primary email address of the GitHub user, or null if not found.
 */
export async function getGitHubUserEmail(accessToken) {
	try {
		let result = await axios.get("https://api.github.com/user/emails", {
			headers: {
				Accept: "application/vnd.github.v3+json",
				"User-Agent": "OAuth App",
				Authorization: `token ${accessToken}`,
			},
		});

		if (result.data) {
			for (let i = 0; i < result.data.length; i++) {
				const emeilEntry = result.data[i];
				if (emeilEntry && emeilEntry.primary && emeilEntry.email)
					return emeilEntry.email;
			}
		}

		return null;
	} catch (err) {}

	return null;
}

/**
 * Revokes the access token and refresh token for a given Git provider.
 *
 * @param {string} provider - The Git provider name.
 * @param {string} accessToken - The access token to be revoked.
 * @param {string} refreshToken - The refresh token to be revoked.
 * @returns {Promise<void>} - A Promise that resolves when the tokens are revoked.
 */
export async function revokeGitProviderAccessToken(
	provider,
	accessToken,
	refreshToken
) {
	try {
		await axios.post(
			`https://auth.agnost.dev/provider/${provider}/revoke`,
			{ accessToken, refreshToken },
			{
				headers: {
					Accept: "application/vnd.github.v3+json",
					"User-Agent": "OAuth App",
					Authorization: `token ${accessToken}`,
				},
			}
		);
	} catch (err) {}
}

/**
 * Fetches all pages of data from the specified URL used to fetch git repositories.
 *
 * @param {string} url - The URL to fetch the data from.
 * @param {object} config - The configuration object for the request.
 * @returns {Promise<Array>} - A promise that resolves to an array of fetched data.
 */
export async function fetchAllPages(url, config) {
	let results = [];
	let page = 1;
	let moreData = true;

	while (moreData) {
		const response = await axios.get(
			`${url}?page=${page}&per_page=100`,
			config
		);
		if (response.data.length > 0) {
			results = results.concat(response.data);
			page++;
		} else {
			moreData = false;
		}
	}

	return results;
}

/**
 * Retrieves the repositories of a given Git provider.
 *
 * @param {Object} gitProvider - The Git provider object.
 * @param {string} gitProvider.provider - The name of the Git provider (e.g., "github").
 * @param {string} gitProvider.accessToken - The access token for the Git provider.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of repository objects.
 */
export async function getGitProviderRepos(gitProvider) {
	if (gitProvider.provider === "github") {
		try {
			const config = {
				headers: {
					Authorization: `Bearer ${gitProvider.accessToken}`,
					"X-GitHub-Api-Version": "2022-11-28",
				},
			};

			const userRepos = await fetchAllPages(
				"https://api.github.com/user/repos",
				config
			);

			const userReposData = userRepos.map((entry) => ({
				repoId: entry.id,
				owner: entry.owner.login,
				repo: entry.name,
				fullName: entry.full_name,
				private: entry.private,
				url: entry.html_url,
			}));

			return userReposData;
		} catch (error) {
			return [];
		}
	}
}

/**
 * Retrieves the branches of a repository from a Git provider.
 *
 * @param {Object} gitProvider - The Git provider object.
 * @param {string} gitProvider.provider - The name of the Git provider (e.g., "github").
 * @param {string} gitProvider.accessToken - The access token for the Git provider.
 * @param {string} owner - The owner of the repository.
 * @param {string} repo - The name of the repository.
 * @param {number} [maxPages=100] - The maximum number of pages to retrieve.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of branch objects.
 * Each branch object has a `name` property representing the branch name and a `protected` property indicating if the branch is protected.
 */
export async function getGitProviderRepoBranches(
	gitProvider,
	owner,
	repo,
	maxPages = 100
) {
	if (gitProvider.provider === "github") {
		try {
			let url = `https://api.github.com/repos/${owner}/${repo}/branches?per_page=${maxPages}`;
			const branches = [];
			let pageCount = 0;

			while (url && pageCount < maxPages) {
				const response = await axios.get(url, {
					headers: {
						Authorization: `Bearer ${gitProvider.accessToken}`,
						Accept: "application/vnd.github.v3+json",
					},
				});

				response.data.forEach((branch) => {
					branches.push({ name: branch.name, protected: branch.protected });
				});

				const linkHeader = response.headers.link;
				if (linkHeader) {
					const matches = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
					url = matches ? matches[1] : null;
				} else {
					url = null; // No more pages
				}

				pageCount++;
			}

			return branches;
		} catch (error) {
			return [];
		}
	}
}
