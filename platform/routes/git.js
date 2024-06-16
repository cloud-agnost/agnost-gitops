import express from "express";
import gitCtrl from "../controllers/gitProvider.js";
import cntrCtrl from "../controllers/container.js";
import { applyRules } from "../schemas/gitProvider.js";
import { authSession } from "../middlewares/authSession.js";
import { authMasterToken } from "../middlewares/authMasterToken.js";
import { checkContentType } from "../middlewares/contentType.js";
import { validate } from "../middlewares/validate.js";
import {
	validateGitProvider,
	validateGitProviderForRefresh,
} from "../middlewares/validateGitProvider.js";
import {
	revokeGitProviderAccessToken,
	getGitProviderRepos,
	getGitProviderRepoBranches,
} from "../handlers/git.js";
import { updateTriggerTemplateAccessTokens } from "../handlers/tekton.js";
import helper from "../util/helper.js";

import ERROR_CODES from "../config/errorCodes.js";

const router = express.Router({ mergeParams: true });

/*
@route      /v1/user/git
@method     GET
@desc       Returns the list of git providers of the user
@access     private
*/
router.get("/", authSession, async (req, res) => {
	try {
		const providers = await gitCtrl.getManyByQuery(
			{ userId: req.user._id },
			{ projection: { accessToken: 0, refreshToken: 0 } }
		);

		res.json(providers);
	} catch (error) {
		helper.handleError(req, res, error);
	}
});

/*
@route      /v1/user/git
@method     POST
@desc       Add a new git provider
@access     private
*/
router.post(
	"/",
	checkContentType,
	authSession,
	applyRules("create"),
	validate,
	async (req, res) => {
		try {
			const { provider, accessToken, refreshToken, expiresAt, gitUser } =
				req.body;

			// Check if the user has already linked the provider
			const existingProvider = await gitCtrl.getOneByQuery({
				userId: req.user._id,
				provider: provider,
				providerUserId: gitUser.providerUserId,
			});

			if (existingProvider) {
				const updatedGitEntry = await gitCtrl.updateOneById(
					existingProvider._id,
					{
						accessToken: helper.encryptText(accessToken),
						refreshToken: refreshToken
							? helper.encryptText(refreshToken)
							: null,
						expiresAt: expiresAt,
						username: gitUser.username,
						email: gitUser.email,
						avatar: gitUser.avatar,
					}
				);

				// When we upate the access token we also need to update the tekton trigger bindings
				// First get the list of containers that are using this git provider
				const containers = await cntrCtrl.getManyByQuery({
					repoOrRegistry: "repo",
					"repo.connected": true,
					"repo.gitProviderId": existingProvider._id,
				});

				await updateTriggerTemplateAccessTokens(
					containers,
					existingProvider.provider,
					accessToken
				);

				delete updatedGitEntry.accessToken;
				delete updatedGitEntry.refreshToken;
				res.json(updatedGitEntry);
			} else {
				const gitEntry = await gitCtrl.create({
					iid: helper.generateSlug("git"),
					userId: req.user._id,
					providerUserId: gitUser.providerUserId,
					provider: provider,
					accessToken: helper.encryptText(accessToken),
					refreshToken: refreshToken ? helper.encryptText(refreshToken) : null,
					expiresAt: expiresAt,
					username: gitUser.username,
					email: gitUser.email,
					avatar: gitUser.avatar,
				});

				delete gitEntry.accessToken;
				delete gitEntry.refreshToken;
				res.json(gitEntry);
			}
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/user/git/:gitProviderId
@method     DELETE
@desc       Delete git provider
@access     private
*/
router.delete(
	"/:gitProviderId",
	authSession,
	validateGitProvider,
	async (req, res) => {
		try {
			const { gitProvider } = req;

			const containers = await cntrCtrl.getManyByQuery({
				repoOrRegistry: "repo",
				"repo.connected": true,
				"repo.gitProviderId": gitProvider._id,
			});

			if (containers.length > 0) {
				return res.status(401).json({
					error: "Not Allowed",
					details: `There are containers with build pipelines dependent to this ${gitProvider.provider} account. First disconnect ${gitProvider.provider} repositories from these containers and then delete this account.`,
					code: ERROR_CODES.notAllowed,
				});
			}

			// First revoke the access token
			await revokeGitProviderAccessToken(
				gitProvider.provider,
				gitProvider.accessToken,
				gitProvider.refreshToken
			);

			// Delete the git provider entry
			await gitCtrl.deleteOneById(gitProvider._id);

			res.json();
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/user/git/:gitProviderId/refresh
@method     POST
@desc       Updates the access and refresh tokens of a git provider
@access     private
*/
router.post(
	"/:gitProviderId/refresh",
	checkContentType,
	authMasterToken,
	validateGitProviderForRefresh,
	async (req, res) => {
		try {
			const { gitProvider } = req;
			const { accessToken, refreshToken, expiresAt } = req.body;

			await gitCtrl.updateOneById(
				gitProvider._id,
				{
					accessToken: helper.encryptText(accessToken),
					refreshToken: helper.encryptText(refreshToken),
					expiresAt: expiresAt,
				},
				{},
				{ cacheKey: gitProvider._id }
			);

			// When we upate the access token we also need to update the tekton trigger bindings
			// First get the list of containers that are using this git provider
			const containers = await cntrCtrl.getManyByQuery({
				repoOrRegistry: "repo",
				"repo.connected": true,
				"repo.gitProviderId": gitProvider._id,
			});

			await updateTriggerTemplateAccessTokens(
				containers,
				gitProvider.provider,
				accessToken
			);

			res.json();
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/user/git/:gitProviderId/repo
@method     GET
@desc       Get git repositories
@access     private
*/
router.get(
	"/:gitProviderId/repo",
	authSession,
	validateGitProvider,
	async (req, res) => {
		try {
			const { gitProvider } = req;

			const repos = await getGitProviderRepos(gitProvider);

			res.json(repos);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/user/git/:gitProviderId/repo/branch?repo=repoName&owner=ownerName
@method     GET
@desc       Get branches of a git repository
@access     private
*/
router.get(
	"/:gitProviderId/repo/branch",
	authSession,
	validateGitProvider,
	applyRules("get-repo-branches"),
	validate,
	async (req, res) => {
		try {
			const { gitProvider } = req;
			const { owner, repo, repoId } = req.query;

			const branches = await getGitProviderRepoBranches({
				gitProvider,
				owner,
				repo,
				repoId,
			});

			res.json(branches);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

export default router;
