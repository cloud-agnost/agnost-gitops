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
				return { valid: false, error: "Invalid or expired token." }; // Token is invalid
			} else {
				return {
					valid: false,
					error: JSON.stringify(error.response?.data ?? error.message),
				}; // Other errors
			}
		}
	} else if (gitProvider === "gitlab") {
		try {
			const result = await axios.get("https://gitlab.com/api/v4/user", {
				headers: { Authorization: `Bearer ${accessToken}` },
			});

			return {
				valid: true,
				user: {
					providerUserId: result.data.id.toString(),
					username: result.data.username,
					email: result.data.email,
					avatar: result.data.avatar_url,
					provider: gitProvider,
				},
			};
		} catch (error) {
			if (error.response && error.response.status === 401) {
				return { valid: false, error: "Invalid or expired token." }; // Token is invalid
			} else {
				return {
					valid: false,
					error: JSON.stringify(error.response?.data ?? error.message),
				}; // Other errors
			}
		}
	} else if (gitProvider === "bitbucket") {
		try {
			const result = await axios.get("https://api.bitbucket.org/2.0/user", {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					Accept: "application/json",
				},
			});

			const email = await getBitbucketUserEmail(accessToken);

			return {
				valid: true,
				user: {
					providerUserId: result.data.uuid,
					username: result.data.username,
					email: email,
					avatar: result.data.links?.avatar?.href,
					provider: gitProvider,
				},
			};
		} catch (error) {
			if (error.response && error.response.status === 401) {
				return { valid: false, error: "Invalid or expired token." }; // Token is invalid
			} else {
				return {
					valid: false,
					error: JSON.stringify(error.response?.data ?? error.message),
				}; // Other errors
			}
		}
	}

	return { valid: false, error: "Unsupported Git repository provider." };
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
	} catch (err) {
		console.error(err);
	}

	return null;
}

/**
 * Retrieves the primary email address associated with the Bitbucket user.
 * @param {string} accessToken - The access token for authenticating the request.
 * @returns {Promise<string|null>} The primary email address of the GitHub user, or null if not found.
 */
export async function getBitbucketUserEmail(accessToken) {
	try {
		let result = await axios.get("https://api.bitbucket.org/2.0/user/emails", {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: "application/json",
			},
		});

		if (result.data) {
			for (let i = 0; i < result.data.values?.length; i++) {
				const emeilEntry = result.data.values[i];
				if (emeilEntry && emeilEntry.is_primary && emeilEntry.email)
					return emeilEntry.email;
			}
		}

		return null;
	} catch (err) {
		console.error(err);
	}

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
		await axios.post(`https://api.agnost.dev/oauth/${provider}/revoke`, {
			accessToken,
			refreshToken,
		});
	} catch (err) {
		console.error(err);
	}
}

/**
 * Fetches all pages of data from the specified URL used to fetch git repositories.
 *
 * @param {string} url - The URL to fetch the data from.
 * @param {object} config - The configuration object for the request.
 * @param {string} provider - The name of the Git provider.
 * @returns {Promise<Array>} - A promise that resolves to an array of fetched data.
 */
export async function fetchAllPages(url, config, provider) {
	let results = [];
	let page = 1;
	let moreData = true;

	while (moreData) {
		const response = await axios.get(
			`${url}?page=${page}&${
				provider === "bitbucket" ? "pagelen" : "per_page"
			}=100`,
			config
		);

		if (provider === "bitbucket") {
			if (response.data.values.length > 0) {
				results = results.concat(response.data.values);
				page++;
			} else {
				moreData = false;
			}
		} else {
			if (response.data.length > 0) {
				results = results.concat(response.data);
				page++;
			} else {
				moreData = false;
			}
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
				config,
				gitProvider.provider
			);
			// In order for a user to add or delete a webhook in GitHub, the user must have at least "Admin" access.
			const userReposData = userRepos
				.filter((entry) => entry.permissions?.admin)
				.map((entry) => ({
					repoId: entry.id,
					repo: entry.name,
					fullName: entry.full_name,
					private: entry.private,
					url: entry.html_url,
					owner: entry.owner.login,
				}));

			return userReposData;
		} catch (err) {
			console.error(err);
			return [];
		}
	} else if (gitProvider.provider === "gitlab") {
		try {
			const config = {
				headers: {
					Authorization: `Bearer ${gitProvider.accessToken}`,
				},
				params: {
					membership: true, // Only get projects the user is a member of
				},
			};

			const userRepos = await fetchAllPages(
				`https://gitlab.com/api/v4/projects`,
				config,
				gitProvider.provider
			);

			// In order for a user to add or delete a webhook in GitLab, the user must have at least "Maintainer" (40) access.
			const userReposData = userRepos
				.filter(
					(entry) =>
						Math.max(
							entry.permissions?.group_access?.access_level ?? 0,
							entry.permissions?.project_access?.access_level ?? 0
						) >= 40
				)
				.map((entry) => ({
					repoId: entry.id,
					repo: entry.path,
					fullName: entry.path_with_namespace,
					private: entry.visibility === "private",
					url: entry.web_url,
				}));

			return userReposData;
		} catch (err) {
			console.error(err);
			return [];
		}
	} else if (gitProvider.provider === "bitbucket") {
		try {
			const config = {
				headers: {
					Authorization: `Bearer ${gitProvider.accessToken}`,
					Accept: "application/json",
				},
			};

			const userRepos = await fetchAllPages(
				`https://api.bitbucket.org/2.0/user/permissions/repositories`,
				config,
				gitProvider.provider
			);
			// In order for a user to add or delete a webhook in Bitbucket, the user must have the admin permission.
			const userReposData = userRepos
				.filter((entry) => entry.permission === "admin")
				.map((entry) => ({
					repoId: entry.repository.uuid,
					repo: entry.repository.name,
					fullName: entry.repository.full_name,
					url: entry.repository.links.html.href,
					owner: entry.repository.full_name.split("/")[0],
				}));

			return userReposData;
		} catch (err) {
			console.error(err);
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
export async function getGitProviderRepoBranches(params) {
	const { gitProvider } = params;
	if (gitProvider.provider === "github") {
		try {
			const { owner, repo, maxPages = 100 } = params;
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
		} catch (err) {
			console.error(err);
			return [];
		}
	} else if (gitProvider.provider === "gitlab") {
		try {
			const { repoId, maxPages = 100 } = params;
			let url = `https://gitlab.com/api/v4/projects/${repoId}/repository/branches`;
			const branches = [];
			let page = 1;

			while (url && page < maxPages) {
				const response = await axios.get(url, {
					headers: {
						Authorization: `Bearer ${gitProvider.accessToken}`,
					},
					params: {
						per_page: maxPages, // Number of branches per page
						page: page,
					},
				});

				response.data.forEach((branch) => {
					branches.push({ name: branch.name, protected: branch.protected });
				});

				const totalPages = response.headers["x-total-pages"];
				if (page < totalPages) {
					page++;
				} else break;
			}

			return branches;
		} catch (err) {
			console.error(err);
			return [];
		}
	} else if (gitProvider.provider === "bitbucket") {
		try {
			const { owner, repo, maxPages = 100 } = params;
			let url = `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}/refs/branches`;
			const branches = [];
			let page = 1;

			while (url && page < maxPages) {
				const response = await axios.get(url, {
					headers: {
						Authorization: `Bearer ${gitProvider.accessToken}`,
						Accept: "application/json",
					},
					params: {
						pagelen: maxPages, // Number of branches per page
						page: page,
					},
				});

				response.data.values.forEach((branch) => {
					branches.push({ name: branch.name });
				});

				if (response.data.values.length > 0) {
					page++;
				} else break;
			}

			return branches;
		} catch (err) {
			console.error(err.response.data);
			return [];
		}
	}
}
