import express from "express";
import gitCtrl from "../controllers/gitProvider.js";
import { applyRules } from "../schemas/gitProvider.js";
import { authSession } from "../middlewares/authSession.js";
import { checkContentType } from "../middlewares/contentType.js";
import { validate } from "../middlewares/validate.js";
import { validateGitProvider } from "../middlewares/validateGitProvider.js";
import {
	revokeGitProviderAccessToken,
	getGitProviderRepos,
	getGitProviderRepoBranches,
} from "../handlers/git.js";
import helper from "../util/helper.js";

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
			const { provider, accessToken, refreshToken, gitUser } = req.body;

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
						username: gitUser.username,
						email: gitUser.email,
						avatar: gitUser.avatar,
					}
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
@desc       Disconnect git provider
@access     private
*/
router.delete(
	"/:gitProviderId",
	authSession,
	validateGitProvider,
	async (req, res) => {
		try {
			const { gitProvider } = req;

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
			const { owner, repo } = req.query;

			const branches = await getGitProviderRepoBranches(
				gitProvider,
				owner,
				repo
			);

			res.json(branches);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

export default router;
