import express from "express";
import authCtrl from "../controllers/auth.js";
import userCtrl from "../controllers/user.js";
import auditCtrl from "../controllers/audit.js";
import clsCtrl from "../controllers/cluster.js";
import orgCtrl from "../controllers/organization.js";
import prjCtrl from "../controllers/project.js";
import gitCtrl from "../controllers/gitProvider.js";
import orgMemberCtrl from "../controllers/organizationMember.js";
import { applyRules } from "../schemas/user.js";
import { checkContentType } from "../middlewares/contentType.js";
import { validate } from "../middlewares/validate.js";
import { authSession } from "../middlewares/authSession.js";
import {
	checkClusterSetupStatus,
	hasClusterSetUpCompleted,
} from "../middlewares/checkClusterSetupStatus.js";
import ERROR_CODES from "../config/errorCodes.js";
import { notificationTypes } from "../config/constants.js";
import { createNamespace } from "../handlers/ns.js";
import helper from "../util/helper.js";

const router = express.Router({ mergeParams: true });

/*
@route      /v1/auth/setup/start
@method     POST
@desc       Initializes the cluster set-up. Signs up the cluster owner using the signup credentials (e.g., gitProvider, accessToken, refreshToken).
			Using the signup credentials of the user, it also creates a git provider entry for the user.
			Creates the cluster configuration entry in the database.
@access     public
*/
router.post(
	"/setup/start",
	checkContentType,
	checkClusterSetupStatus,
	applyRules("start-setup"),
	validate,
	async (req, res) => {
		// Start new database transaction session
		const session = await userCtrl.startSession();
		try {
			let userId = helper.generateId();
			const { provider, accessToken, refreshToken, expiresAt, gitUser } =
				req.body;

			// Save user to the database
			const userObj = await userCtrl.create(
				{
					_id: userId,
					iid: helper.generateSlug("usr"),
					name: gitUser.username,
					color: helper.generateColor("dark"),
					email: gitUser.email,
					lastLoginAt: Date.now(),
					pictureUrl: gitUser.avatar,
					canCreateOrg: true,
					isClusterOwner: true,
					provider: provider,
					providerUserId: gitUser.providerUserId,
					notifications: notificationTypes,
					status: "Active",
				},
				{ session }
			);

			// Create a new git provider entry for the user
			await gitCtrl.create(
				{
					iid: helper.generateSlug("git"),
					userId: userId,
					providerUserId: gitUser.providerUserId,
					provider: provider,
					accessToken: helper.encryptText(accessToken),
					refreshToken: refreshToken ? helper.encryptText(refreshToken) : null,
					expiresAt: expiresAt,
					username: gitUser.username,
					email: gitUser.email,
					avatar: gitUser.avatar,
				},
				{ session }
			);

			// Initialize cluster configuration. Creates the cluster organization, project, environment and default cluster containers
			await clsCtrl.initializeCluster(session, userObj);

			// Create new session
			let tokens = await authCtrl.createSession(
				userId,
				helper.getIP(req),
				req.headers["user-agent"],
				provider
			);

			// Commit transaction
			await userCtrl.commit(session);

			// Remove password field value from returned object
			res.json({ ...userObj, ...tokens });

			// Log action
			auditCtrl.log(
				userObj,
				"user",
				"initiate-cluster-setup",
				"Initiated cluster setup"
			);
		} catch (error) {
			await userCtrl.rollback(session);
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/auth/setup/end
@method     POST
@desc       Finalizes the cluster set-up. Creates the initial organization and project.
@access     public
*/
router.post(
	"/setup/end",
	checkContentType,
	hasClusterSetUpCompleted,
	authSession,
	applyRules("end-setup"),
	validate,
	async (req, res) => {
		// Start new database transaction session
		const session = await userCtrl.startSession();
		try {
			const { user } = req;
			const { orgName, projectName, environmentName } = req.body;

			// Check if the user is cluster owner or not
			if (!user.isClusterOwner) {
				await userCtrl.endSession(session);

				return res.status(422).json({
					error: "Not Allowed",
					details: "Only cluster owners can finalize cluster set-up.",
					code: ERROR_CODES.notAllowed,
				});
			}

			// Check whether cluster set up has been finalized or not. If we have a non-cluster organization then it means that cluster set-up has been finalized
			const org = await orgCtrl.getOneByQuery({ isClusterEntity: false });
			if (org) {
				await userCtrl.endSession(session);

				return res.status(422).json({
					error: "Not Allowed",
					details: "Cluster set-up has already been finalized.",
					code: ERROR_CODES.notAllowed,
				});
			}

			// Create the new organization object
			let orgId = helper.generateId();
			let orgObj = await orgCtrl.create(
				{
					_id: orgId,
					ownerUserId: user._id,
					iid: helper.generateSlug("org"),
					name: orgName,
					color: helper.generateColor("light"),
					createdBy: user._id,
				},
				{ session, cacheKey: orgId }
			);

			// Add the creator of the organization as an 'Admin' member
			await orgMemberCtrl.create(
				{
					orgId: orgId,
					userId: user._id,
					role: "Admin",
				},
				{ session, cacheKey: `${orgId}.${user._id}` }
			);

			// Create the new project and associated environment
			const { project, environment } = await prjCtrl.createProject(
				session,
				user,
				orgObj,
				projectName,
				environmentName
			);

			// Create the namespace in the Kubernetes cluster
			await createNamespace(environment);

			// Commit changes to the database
			await userCtrl.commit(session);
			res.json({ org: orgObj, project, environment });

			// Log action
			auditCtrl.log(
				user,
				"user",
				"finalize-cluster-setup",
				"Completed cluster setup"
			);
		} catch (error) {
			await userCtrl.rollback(session);
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/auth/login
@method     POST
@desc       Login with oauth flow of a git provider
@access     public
*/
router.post(
	"/login",
	checkContentType,
	applyRules("login"),
	validate,
	async (req, res) => {
		try {
			const { gitUser } = req.body;

			// Get user record
			let user = await userCtrl.getOneByQuery({
				provider: gitUser.provider,
				providerUserId: gitUser.providerUserId,
			});

			if (!user) {
				return res.status(401).json({
					error: "Invalid Credentials",
					code: ERROR_CODES.invalidCredentials,
					details: "Invalid credentials. No such user exists.",
				});
			}

			// Update user's last login information
			user = await userCtrl.updateOneById(user._id, {
				lastLoginAt: Date.now(),
			});

			// Success, create the session token and return user information and do not return the password field value
			let tokens = await authCtrl.createSession(
				user._id,
				helper.getIP(req),
				req.headers["user-agent"],
				gitUser.provider
			);

			res.json({ ...user, ...tokens });

			// Log action
			auditCtrl.log(
				user,
				"user",
				"login",
				`Logged in using ${gitUser.provider} credentials`
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/auth/logout
@method     POST
@desc       Logout from current session
@access     private
*/
router.post("/logout", authSession, async (req, res) => {
	try {
		// Delete the session token and also the associated refresh token
		await authCtrl.deleteSession(req.session, true);
		res.json();
	} catch (error) {
		helper.handleError(req, res, error);
	}
});

export default router;
