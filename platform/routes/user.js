import config from "config";
import express from "express";
import sharp from "sharp";
import userCtrl from "../controllers/user.js";
import auditCtrl from "../controllers/audit.js";
import orgInvitationCtrl from "../controllers/organizationInvitation.js";
import prjInvitationCtrl from "../controllers/projectInvitation.js";
import orgMemberCtrl from "../controllers/organizationMember.js";
import prjCtrl from "../controllers/project.js";
import authCtrl from "../controllers/auth.js";
import orgCtrl from "../controllers/organization.js";
import gitCtrl from "../controllers/gitProvider.js";
import { applyRules } from "../schemas/user.js";
import { authSession } from "../middlewares/authSession.js";
import { checkContentType } from "../middlewares/contentType.js";
import { validate } from "../middlewares/validate.js";
import { fileUploadMiddleware } from "../middlewares/handleFile.js";
import { storage } from "../init/storage.js";
import { notificationTypes } from "../config/constants.js";
import { sendMessage as sendNotification } from "../init/sync.js";
import { deleteKey } from "../init/cache.js";
import helper from "../util/helper.js";

import ERROR_CODES from "../config/errorCodes.js";

const router = express.Router({ mergeParams: true });

/*
@route      /v1/user/me
@method     GET
@desc       Returns the user information associated with the access token
@access     private
*/
router.get("/me", authSession, async (req, res) => {
	try {
		res.json(req.user);
	} catch (error) {
		helper.handleError(req, res, error);
	}
});

/*
@route      /v1/user
@method     DELETE
@desc       Deletes (anonymizes) the user account, removes also the user from organization and project memberships
@access     private
*/
router.delete("/", authSession, async (req, res) => {
	// Start new database transaction session
	const session = await userCtrl.startSession();
	try {
		const { user } = req;
		if (user.isClusterOwner) {
			return res.status(400).json({
				error: "Not Allowed",
				code: ERROR_CODES.notAllowed,
				details:
					"You are the owner of the cluster. If you would like to delete your account, you first need to transfer cluster ownership to another user of the cluster.",
			});
		}

		await userCtrl.updateOneById(
			user._id,
			{
				name: "Anonymous",
				email: "Anonymous",
				color: helper.generateColor("dark"),
				status: "Deleted",
				canCreateOrg: false,
				isClusterOwner: false,
				providerUserId: "Anonymous",
				lastLoginAt: new Date(),
			},
			{ pictureUrl: 1, notifications: 1 },
			{ session }
		);

		// Clear the cache of the user
		await deleteKey(user._id);

		// Get organization memberships of the user
		let orgMemberships = await orgMemberCtrl.getManyByQuery(
			{
				userId: user._id,
			},
			{
				session,
			}
		);

		// Remove user from organization teams
		for (let i = 0; i < orgMemberships.length; i++) {
			const orgMembership = orgMemberships[i];
			// Leave the organization team
			await orgMemberCtrl.deleteOneByQuery(
				{ orgId: orgMembership.orgId, userId: user._id },
				{
					cacheKey: `${orgMembership.orgId}.${user._id}`,
					session,
				}
			);
		}

		// Delete organization invitations
		await orgInvitationCtrl.deleteManyByQuery(
			{ email: user.email },
			{ session }
		);

		// Check to see if the user has project team memberships.
		let projects = await prjCtrl.getManyByQuery(
			{
				"team.userId": user._id,
			},
			{ session }
		);

		// Remove user from project teams
		for (let i = 0; i < projects.length; i++) {
			const project = projects[i];
			await prjCtrl.pullObjectByQuery(
				project._id,
				"team",
				{ userId: user._id },
				{},
				{ cacheKey: project._id, session }
			);
		}

		// Delete project invitations
		await prjInvitationCtrl.deleteManyByQuery(
			{ email: user.email },
			{ session }
		);

		// Delete git provider entries
		await gitCtrl.deleteManyByQuery({ userId: user._id }, { session });

		// Commit transaction
		await userCtrl.commit(session);
		// Clear the session of the user
		await authCtrl.deleteSession(req.session, true);

		res.json();

		// Send realtime notifications for updated organizations
		orgMemberships.forEach((orgMembership) => {
			sendNotification(orgMembership.orgId, {
				actor: {
					userId: user._id,
					name: user.name,
					pictureUrl: user.pictureUrl,
					color: user.color,
					email: user.email,
				},
				action: "delete",
				object: "org.member",
				description: `User '${user.name}' (${user.email}) has left the organization team.`,
				timestamp: Date.now(),
				data: {
					_id: user._id,
					iid: user.iid,
					color: user.color,
					name: user.name,
					pictureUrl: user.pictureUrl,
					email: user.email,
				},
				identifiers: { orgId: orgMembership.orgId },
			});
		});

		// Send realtime notifications for updated projects
		projects.forEach(async (project) => {
			let projectWithTeam = await prjCtrl.getOneById(project._id, {
				lookup: {
					path: "team.userId",
				},
			});

			sendNotification(project._id, {
				actor: {
					userId: user._id,
					name: user.name,
					pictureUrl: user.pictureUrl,
					color: user.color,
					email: user.email,
				},
				action: "delete",
				object: "org.project.team",
				description: `User '${user.name}' (${user.email}) has left the project team`,
				timestamp: Date.now(),
				data: projectWithTeam,
				identifiers: { orgId: project.orgId, projectId: project._id },
			});
		});
	} catch (error) {
		await userCtrl.rollback(session);
		helper.handleError(req, res, error);
	}
});

/*
@route      /v1/user/list?page=0&size=10&search&sortBy=name&sortDir=asc
@method     GET
@desc       Searches all active users in a cluster by their name or email, excludes the user that is making the request. By default returns users sorted by name ascending order.
@access     private
*/
router.get(
	"/list",
	authSession,
	applyRules("search"),
	validate,
	async (req, res) => {
		try {
			const { user } = req;
			const { page, size, search, sortBy, sortDir } = req.query;

			let query = { _id: { $ne: user._id }, status: "Active" };
			if (search && search !== "null") {
				query.$or = [
					{
						name: { $regex: helper.escapeStringRegexp(search), $options: "i" },
					},
					{
						email: {
							$regex: helper.escapeStringRegexp(search),
							$options: "i",
						},
					},
				];
			}

			let sort = {};
			if (sortBy && sortDir) {
				sort[sortBy] = sortDir;
			} else sort = { name: "asc" };

			let users = await userCtrl.getManyByQuery(query, {
				sort,
				skip: size * page,
				limit: size,
			});

			res.json(users);
		} catch (err) {
			helper.handleError(req, res, err);
		}
	}
);

/*
@route      /v1/user/name
@method     PUT
@desc       Updates the name of the user
@access     private
*/
router.put(
	"/name",
	checkContentType,
	authSession,
	applyRules("update-name"),
	validate,
	async (req, res) => {
		try {
			let userObj = await userCtrl.updateOneById(
				req.user._id,
				{
					name: req.body.name,
				},
				{},
				{ cacheKey: req.user._id }
			);

			res.json(userObj);

			// Log action
			auditCtrl.logAndNotify(
				userObj._id,
				userObj,
				"user",
				"update",
				`Updated name to '${req.body.name}'`,
				userObj
			);

			auditCtrl.updateActorName(userObj._id, req.body.name);
			orgInvitationCtrl.updateHostName(userObj._id, req.body.name);
			prjInvitationCtrl.updateHostName(userObj._id, req.body.name);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/user/picture?width=128&height=128
@method     PUT
@desc       Updates the profile image of the user. A picture with the name 'picture' needs to be uploaded in the body of the request.
@access     private
*/
router.put(
	"/picture",
	fileUploadMiddleware,
	authSession,
	applyRules("upload-picture"),
	validate,
	async (req, res) => {
		try {
			let buffer = req.file?.buffer;
			let { width, height } = req.query;
			if (!width) width = config.get("general.profileImgSizePx");
			if (!height) height = config.get("general.profileImgSizePx");

			if (!req.file || !buffer) {
				return res.status(422).json({
					error: "Missing Upload File",
					details: "Missing file, no file uploaded.",
					code: ERROR_CODES.fileUploadError,
				});
			}

			// Resize image if width and height specified and if the image is not in svg format
			if (req.file.mimetype !== "image/svg+xml")
				buffer = await sharp(req.file.buffer).resize(width, height).toBuffer();

			// Specify the directory where you want to store the image
			const uploadBucket = config.get("general.storageBucket");
			// Ensure file storage folder exists
			await storage.ensureBucket(uploadBucket);
			// Delete existing file if it exists
			await storage.deleteFile(uploadBucket, req.user.pictureUrl);
			// Save the new file
			const filePath = `storage/avatars/${helper.generateSlug("img", 6)}-${
				req.file.originalname
			}`;

			const metaData = {
				"Content-Type": req.file.mimetype,
			};
			await storage.saveFile(uploadBucket, filePath, buffer, metaData);

			// Update user with the new profile image url
			let userObj = await userCtrl.updateOneById(
				req.user._id,
				{
					pictureUrl: filePath,
				},
				{},
				{ cacheKey: req.user._id }
			);

			res.json(userObj);

			// Log action
			auditCtrl.logAndNotify(
				userObj._id,
				userObj,
				"user",
				"update",
				"Updated profile picture",
				userObj
			);

			auditCtrl.updateActorPicture(userObj._id, filePath);
			orgInvitationCtrl.updateHostPicture(userObj._id, filePath);
			prjInvitationCtrl.updateHostPicture(userObj._id, filePath);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/user/picture
@method     DELETE
@desc       Removes the profile picture of the user.
@access     private
*/
router.delete("/picture", authSession, async (req, res) => {
	try {
		// Delete existing file if it exists
		const uploadBucket = config.get("general.storageBucket");
		storage.deleteFile(uploadBucket, req.user.pictureUrl);

		// Update user with the new profile image url
		let userObj = await userCtrl.updateOneById(
			req.user._id,
			{},
			{ pictureUrl: 1 },
			{ cacheKey: req.user._id }
		);

		res.json(userObj);

		// Log action
		auditCtrl.logAndNotify(
			userObj._id,
			userObj,
			"user",
			"update",
			"Removed profile picture",
			userObj
		);
		auditCtrl.removeActorPicture(userObj._id);
		orgInvitationCtrl.removeHostPicture(userObj._id);
		prjInvitationCtrl.removeHostPicture(userObj._id);
	} catch (error) {
		helper.handleError(req, res, error);
	}
});

/*
@route      /v1/user/notifications
@method     PUT
@desc       Updates the notification settings of the user. The full notifications list is needed, it directly sets the new value
@access     private
*/
router.put(
	"/notifications",
	checkContentType,
	authSession,
	applyRules("update-notifications"),
	validate,
	async (req, res) => {
		try {
			let userObj = await userCtrl.updateOneById(
				req.user._id,
				{
					notifications: req.body.notifications,
				},
				{},
				{ cacheKey: req.user._id }
			);

			res.json(userObj);

			// Log action
			auditCtrl.logAndNotify(
				userObj._id,
				userObj,
				"user",
				"update",
				"Updated notification settings",
				userObj
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/user/org-invite
@method     GET
@desc       Get pending organization invitations of user
@access     private
*/
router.get("/org-invite", authSession, async (req, res) => {
	try {
		const { user } = req;
		let invites = await orgInvitationCtrl.getManyByQuery(
			{
				email: user.email,
				status: "Pending",
			},
			{ lookup: "orgId" }
		);

		res.json(invites);
	} catch (error) {
		helper.handleError(req, res, error);
	}
});

/*
@route      /v1/user/project-invite
@method     GET
@desc       Get pending project invitations of user
@access     private
*/
router.get("/project-invite", authSession, async (req, res) => {
	try {
		const { user } = req;
		let invites = await prjInvitationCtrl.getManyByQuery(
			{
				email: user.email,
				status: "Pending",
			},
			{ lookup: "projectId" }
		);

		res.json(invites);
	} catch (error) {
		helper.handleError(req, res, error);
	}
});

/*
@route      /v1/user/org-invite-accept?token&provider&accessToken&refreshToken
@method     POST
@desc       Accept organization invitation for a new user or a signed out user
@access     private
*/
router.post(
	"/org-invite-accept",
	checkContentType,
	applyRules("accept-org-invite"),
	validate,
	async (req, res) => {
		// Start new database transaction session
		const session = await userCtrl.startSession();
		try {
			const { token, accessToken, refreshToken } = req.query;
			const { gitUser } = req.body;

			let invite = await orgInvitationCtrl.getOneByQuery(
				{ token },
				{ lookup: "orgId" }
			);

			if (!invite || !invite.orgId) {
				await userCtrl.endSession(session);
				return res.status(404).json({
					error: "Not Found",
					details: "No such invitation exists for the organization.",
					code: ERROR_CODES.notFound,
				});
			}

			if (invite.status !== "Pending") {
				await userCtrl.endSession(session);
				return res.status(422).json({
					error: "Not Allowed",
					details:
						"Invitations only in 'pending' status can be accepted. It seems you have already accepted or rejected this invitation.",
					code: ERROR_CODES.notAllowed,
				});
			}

			// Get user record
			let user = await userCtrl.getOneByQuery({
				provider: gitUser.provider,
				providerUserId: gitUser.providerUserId,
			});

			if (user) {
				// Check whether the user is already a member of the organization or not
				let member = await orgMemberCtrl.getOneByQuery(
					{
						orgId: invite.orgId._id,
						userId: user._id,
					},
					{ cacheKey: `${invite.orgId._id}.${user._id}` }
				);

				if (member) {
					await userCtrl.endSession(session);
					return res.status(422).json({
						error: "Already Member",
						details: `You are already a member of the organization '${invite.orgId.name}' team.`,
						code: ERROR_CODES.notAllowed,
					});
				}
			} else {
				// Create a new user
				let userId = helper.generateId();
				user = await userCtrl.create(
					{
						_id: userId,
						iid: helper.generateSlug("usr"),
						name: gitUser.username,
						color: helper.generateColor("dark"),
						email: gitUser.email,
						lastLoginAt: Date.now(),
						pictureUrl: gitUser.avatar,
						canCreateOrg: invite.role === "Admin" ? true : false,
						isClusterOwner: false,
						provider: gitUser.provider,
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
						provider: gitUser.provider,
						accessToken: helper.encryptText(accessToken),
						refreshToken: refreshToken
							? helper.encryptText(refreshToken)
							: null,
						username: gitUser.username,
						email: gitUser.email,
						avatar: gitUser.avatar,
					},
					{ session }
				);

				// Create new session for the new user
				let tokens = await authCtrl.createSession(
					userId,
					helper.getIP(req),
					req.headers["user-agent"],
					gitUser.provider
				);

				user = { ...user, ...tokens };
			}

			// Accept invitation
			await orgInvitationCtrl.updateOneById(
				invite._id,
				{ status: "Accepted" },
				{},
				{ session }
			);

			// Add user to the organization as a member
			await orgMemberCtrl.create(
				{
					orgId: invite.orgId._id,
					userId: user._id,
					role: invite.role,
				},
				{ session, cacheKey: `${invite.orgId._id}.${user._id}` }
			);

			// Commit transaction
			await userCtrl.commit(session);

			// Return the organization object the user is added as a mamber
			res.json({ org: invite.orgId, role: invite.role, user });

			// Log action
			auditCtrl.logAndNotify(
				invite.orgId._id,
				user,
				"org",
				"accept",
				"Accepted the invitation to join to the organization",
				{ ...invite.orgId, role: invite.role, user },
				{ orgId: invite.orgId._id }
			);
		} catch (error) {
			await userCtrl.rollback(session);
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/user/org-invite-accept-session?token&provider&accessToken&refreshToken
@method     POST
@desc       Accept organization invitation for a signed in user
@access     private
*/
router.post(
	"/org-invite-accept-session",
	checkContentType,
	authSession,
	applyRules("accept-org-invite-session"),
	validate,
	async (req, res) => {
		// Start new database transaction session
		const session = await userCtrl.startSession();
		try {
			const { token } = req.query;
			const { user } = req;

			let invite = await orgInvitationCtrl.getOneByQuery(
				{ token },
				{ lookup: "orgId" }
			);

			if (!invite || !invite.orgId) {
				await userCtrl.endSession(session);
				return res.status(404).json({
					error: "Not Found",
					details: "No such invitation exists for the organization.",
					code: ERROR_CODES.notFound,
				});
			}

			if (invite.status !== "Pending") {
				await userCtrl.endSession(session);
				return res.status(422).json({
					error: "Not Allowed",
					details:
						"Invitations only in 'pending' status can be accepted. It seems you have already accepted or rejected this invitation.",
					code: ERROR_CODES.notAllowed,
				});
			}

			// Check whether the user is already a member of the organization or not
			let member = await orgMemberCtrl.getOneByQuery(
				{
					orgId: invite.orgId._id,
					userId: user._id,
				},
				{ cacheKey: `${invite.orgId._id}.${user._id}` }
			);

			if (member) {
				await userCtrl.endSession(session);
				return res.status(422).json({
					error: "Already Member",
					details: `You are already a member of the organization '${invite.orgId.name}' team.`,
					code: ERROR_CODES.notAllowed,
				});
			}

			// Accept invitation
			await orgInvitationCtrl.updateOneById(
				invite._id,
				{ status: "Accepted" },
				{},
				{ session }
			);

			// Add user to the organization as a member
			await orgMemberCtrl.create(
				{
					orgId: invite.orgId._id,
					userId: user._id,
					role: invite.role,
				},
				{ session, cacheKey: `${invite.orgId._id}.${user._id}` }
			);

			// Commit transaction
			await userCtrl.commit(session);

			// Return the organization object the user is added as a mamber
			res.json({ org: invite.orgId, role: invite.role, user });

			// Log action
			auditCtrl.logAndNotify(
				invite.orgId._id,
				user,
				"org",
				"accept",
				"Accepted the invitation to join to the organization",
				{ ...invite.orgId, role: invite.role, user },
				{ orgId: invite.orgId._id }
			);
		} catch (error) {
			await userCtrl.rollback(session);
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/user/project-invite-accept?token&provider&accessToken&refreshToken
@method     POST
@desc       Accept project invitation for a new user or a signed out user
@access     private
*/
router.post(
	"/project-invite-accept",
	checkContentType,
	applyRules("accept-project-invite"),
	validate,
	async (req, res) => {
		// Start new database transaction session
		const session = await userCtrl.startSession();
		try {
			const { token, accessToken, refreshToken } = req.query;
			const { gitUser } = req.body;

			let invite = await prjInvitationCtrl.getOneByQuery(
				{ token },
				{ lookup: "projectId" }
			);

			if (!invite || !invite.projectId) {
				await userCtrl.endSession(session);
				return res.status(404).json({
					error: "Not Found",
					details: "No such invitation exists for the project.",
					code: ERROR_CODES.notFound,
				});
			}

			if (invite.status !== "Pending") {
				await userCtrl.endSession(session);
				return res.status(422).json({
					error: "Not Allowed",
					details:
						"Invitations only in 'pending' status can be accepted. It seems you have already accepted/rejected this invitation.",
					code: ERROR_CODES.notAllowed,
				});
			}

			// Check if the user is already a cluster user
			let user = await userCtrl.getOneByQuery({
				provider: gitUser.provider,
				providerUserId: gitUser.providerUserId,
			});

			if (user) {
				// Check whether the user is already a member of the project team or not
				let projectMember = invite.projectId.team.find(
					(entry) => entry.userId.toString() === user._id.toString()
				);

				if (projectMember) {
					await userCtrl.endSession(session);
					return res.status(422).json({
						error: "Already Member",
						details: `You are already a member of the project '${invite.projectId.name}' team.`,
						code: ERROR_CODES.notAllowed,
					});
				}

				// Check whether the user is already a member of the organization or not
				let orgMember = await orgMemberCtrl.getOneByQuery(
					{
						orgId: invite.orgId,
						userId: user._id,
					},
					{ cacheKey: `${invite.orgId}.${user._id}` }
				);

				if (!orgMember) {
					// Add user to the organization as a member
					await orgMemberCtrl.create(
						{
							orgId: invite.orgId,
							userId: user._id,
							role: invite.orgRole,
						},
						{ session, cacheKey: `${invite.orgId}.${user._id}` }
					);
				}
			} else {
				// Create a new cluster user
				let userId = helper.generateId();
				user = await userCtrl.create(
					{
						_id: userId,
						iid: helper.generateSlug("usr"),
						name: gitUser.username,
						color: helper.generateColor("dark"),
						email: gitUser.email,
						lastLoginAt: Date.now(),
						pictureUrl: gitUser.avatar,
						canCreateOrg: invite.orgRole === "Admin" ? true : false,
						isClusterOwner: false,
						provider: gitUser.provider,
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
						provider: gitUser.provider,
						accessToken: helper.encryptText(accessToken),
						refreshToken: refreshToken
							? helper.encryptText(refreshToken)
							: null,
						username: gitUser.username,
						email: gitUser.email,
						avatar: gitUser.avatar,
					},
					{ session }
				);

				// Add user to the organization as a member
				await orgMemberCtrl.create(
					{
						orgId: invite.orgId,
						userId: user._id,
						role: invite.orgRole,
					},
					{ session, cacheKey: `${invite.orgId}.${user._id}` }
				);
			}

			// Add user to the project team
			await prjCtrl.pushObjectById(
				invite.projectId._id,
				"team",
				{
					userId: user._id,
					role: invite.role,
				},
				{},
				{ session, cacheKey: `${invite.projectId._id}` }
			);

			// Accept invitation
			await prjInvitationCtrl.updateOneById(
				invite._id,
				{ status: "Accepted" },
				{},
				{ session }
			);

			let projectWithTeam = await prjCtrl.getOneById(invite.projectId._id, {
				lookup: {
					path: "team.userId",
				},
				session,
			});

			// Commit transaction
			await userCtrl.commit(session);

			// Return the project object the user is added as a mamber
			res.json({ project: projectWithTeam, role: invite.role, user });

			// Log action
			auditCtrl.logAndNotify(
				invite.projectId._id,
				user,
				"org.project",
				"accept",
				"Accepted the invitation to join to the project",
				projectWithTeam,
				{ orgId: invite.orgId, projectId: invite.projectId._id }
			);
		} catch (error) {
			await userCtrl.rollback(session);
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/user/project-invite-accept-session?token&provider&accessToken&refreshToken
@method     POST
@desc       Accept organization invitation for a signed in user
@access     private
*/
router.post(
	"/project-invite-accept-session",
	checkContentType,
	authSession,
	applyRules("accept-project-invite-session"),
	validate,
	async (req, res) => {
		// Start new database transaction session
		const session = await userCtrl.startSession();
		try {
			const { token } = req.query;
			const { user } = req;

			let invite = await prjInvitationCtrl.getOneByQuery(
				{ token },
				{ lookup: "projectId" }
			);

			if (!invite || !invite.projectId) {
				await userCtrl.endSession(session);
				return res.status(404).json({
					error: "Not Found",
					details: "No such invitation exists for the project.",
					code: ERROR_CODES.notFound,
				});
			}

			if (invite.status !== "Pending") {
				await userCtrl.endSession(session);
				return res.status(422).json({
					error: "Not Allowed",
					details:
						"Invitations only in 'pending' status can be accepted. It seems you have already accepted/rejected this invitation.",
					code: ERROR_CODES.notAllowed,
				});
			}

			// Check whether the user is already a member of the project team or not
			let projectMember = invite.projectId.team.find(
				(entry) => entry.userId.toString() === user._id.toString()
			);

			if (projectMember) {
				await userCtrl.endSession(session);
				return res.status(422).json({
					error: "Already Member",
					details: `You are already a member of the project '${invite.projectId.name}' team.`,
					code: ERROR_CODES.notAllowed,
				});
			}

			// Check whether the user is already a member of the organization or not
			let orgMember = await orgMemberCtrl.getOneByQuery(
				{
					orgId: invite.orgId,
					userId: user._id,
				},
				{ cacheKey: `${invite.orgId}.${user._id}` }
			);

			if (!orgMember) {
				// Add user to the organization as a member
				await orgMemberCtrl.create(
					{
						orgId: invite.orgId,
						userId: user._id,
						role: invite.orgRole,
					},
					{ session, cacheKey: `${invite.orgId}.${user._id}` }
				);
			}

			// Add user to the project team
			await prjCtrl.pushObjectById(
				invite.projectId._id,
				"team",
				{
					userId: user._id,
					role: invite.role,
				},
				{},
				{ session, cacheKey: `${invite.projectId._id}` }
			);

			// Accept invitation
			await prjInvitationCtrl.updateOneById(
				invite._id,
				{ status: "Accepted" },
				{},
				{ session }
			);

			let projectWithTeam = await prjCtrl.getOneById(invite.projectId._id, {
				lookup: {
					path: "team.userId",
				},
				session,
			});

			// Commit transaction
			await userCtrl.commit(session);

			// Return the project object the user is added as a mamber
			res.json({ project: projectWithTeam, role: invite.role, user });

			// Log action
			auditCtrl.logAndNotify(
				invite.projectId._id,
				user,
				"org.project",
				"accept",
				"Accepted the invitation to join to the project",
				projectWithTeam,
				{ orgId: invite.orgId, projectId: invite.projectId._id }
			);
		} catch (error) {
			await userCtrl.rollback(session);
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/user/org-invite-reject?token
@method     POST
@desc       Reject organization invitation
@access     private
*/
router.post(
	"/org-invite-reject",
	checkContentType,
	applyRules("reject-org-invite"),
	validate,
	async (req, res) => {
		try {
			const { token } = req.query;

			// Make sure that the invitation token is associated with the email of the user
			let invite = await orgInvitationCtrl.getOneByQuery(
				{ token },
				{ lookup: "orgId" }
			);

			if (!invite || !invite.orgId) {
				return res.status(404).json({
					error: "Not Found",
					details: "No such invitation exists for the organization.",
					code: ERROR_CODES.notFound,
				});
			}

			if (invite.status !== "Pending") {
				return res.status(422).json({
					error: "Not Allowed",
					details: "Invitations only in 'pending' status can be rejected.",
					code: ERROR_CODES.notAllowed,
				});
			}

			// Reject invitation
			await orgInvitationCtrl.updateOneById(invite._id, { status: "Rejected" });

			res.json();
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/user/project-invite-reject?token
@method     POST
@desc       Reject project invitation
@access     private
*/
router.post(
	"/project-invite-reject",
	checkContentType,
	applyRules("reject-project-invite"),
	validate,
	async (req, res) => {
		try {
			const { token } = req.query;

			// Make sure that the invitation token is associated with the email of the user
			let invite = await prjInvitationCtrl.getOneByQuery({ token });

			if (!invite || !invite.projectId) {
				return res.status(404).json({
					error: "Not Found",
					details: "No such invitation exists for the project.",
					code: ERROR_CODES.notFound,
				});
			}

			if (invite.status !== "Pending") {
				return res.status(422).json({
					error: "Not Allowed",
					details: "Invitations only in 'pending' status can be rejected.",
					code: ERROR_CODES.notAllowed,
				});
			}

			// Reject invitation
			await prjInvitationCtrl.updateOneById(invite._id, { status: "Rejected" });

			res.json();
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/user/transfer/:userId
@method     POST
@desc       Transfers the ownership of the cluster to another cluster member
@access     private
*/
router.post(
	"/transfer/:userId",
	checkContentType,
	authSession,
	applyRules("transfer"),
	validate,
	async (req, res) => {
		// Start new database transaction session
		const session = await userCtrl.startSession();
		try {
			if (!req.user.isClusterOwner) {
				return res.status(400).json({
					error: "Not Allowed",
					details:
						"Only a cluster owner can transfer the ownership to another 'Active' cluster user.",
					code: ERROR_CODES.notAllowed,
				});
			}

			// Get transferred user information
			let transferredUser = await userCtrl.getOneById(req.params.userId);

			// If the current owner and the trasferred users are the same then do nothing
			if (transferredUser._id.toString() === req.user._id.toString()) {
				await userCtrl.endSession(session);
				return res.json();
			}

			// Take ownership of cluster from existing user
			let originalUser = await userCtrl.updateOneById(
				req.user._id,
				{ isClusterOwner: false },
				{},
				{ session, cacheKey: req.user._id }
			);

			// Transfer cluster ownership to the new user
			transferredUser = await userCtrl.updateOneById(
				transferredUser._id,
				{ isClusterOwner: true, canCreateOrg: true },
				{},
				{ session, cacheKey: transferredUser._id }
			);

			// Update all existing organization memberships of the transferred user to Admin
			let orgMemberships = await orgMemberCtrl.getManyByQuery(
				{ userId: transferredUser._id },
				{ session }
			);

			for (let i = 0; i < orgMemberships.length; i++) {
				const orgMembership = orgMemberships[i];
				await orgMemberCtrl.updateOneById(
					orgMembership._id,
					{ role: "Admin" },
					{},
					{ session, cacheKey: `${orgMembership.orgId}.${transferredUser._id}` }
				);
			}

			// Update all existing project memberships of the transferred user to Admin
			let projects = await prjCtrl.getManyByQuery(
				{ "team.userId": transferredUser._id },
				{ session }
			);

			for (let i = 0; i < projects.length; i++) {
				const project = projects[i];
				await prjCtrl.updateOneByQuery(
					{ _id: project._id, "team.userId": transferredUser._id },
					{ "team.$.role": "Admin" },
					{},
					{ session, cacheKey: `${project._id}` }
				);
			}

			// Commit transaction
			await userCtrl.commit(session);
			res.json();

			// Send realtime notifications
			for (let i = 0; i < orgMemberships.length; i++) {
				const orgMembership = orgMemberships[i];
				// Get organization information
				const orgInfo = await orgCtrl.getOneById(orgMembership.orgId, {
					cacheKey: orgMembership.orgId,
				});

				sendNotification(orgMembership.orgId, {
					actor: {
						userId: req.user._id,
						name: req.user.name,
						pictureUrl: req.user.pictureUrl,
						color: req.user.color,
						email: req.user.email,
					},
					action: "update",
					object: "org.member",
					description: `Updated organization member role of user '${transferredUser.name}' (${transferredUser.email}) to 'Admin'`,
					timestamp: Date.now(),
					data: {
						...orgMembership,
						member: {
							_id: transferredUser._id,
							iid: transferredUser.iid,
							color: transferredUser.color,
							name: transferredUser.name,
							pictureUrl: transferredUser.pictureUrl,
							email: transferredUser.email,
							isOrgOwner:
								orgInfo.ownerUserId.toString() ===
								transferredUser._id.toString(),
						},
					},
					identifiers: { orgId: orgMembership.orgId },
				});
			}

			// Send realtime notifications
			for (let i = 0; i < projects.length; i++) {
				const project = projects[i];

				let projectWithTeam = await prjCtrl.getOneById(project._id, {
					lookup: {
						path: "team.userId",
					},
				});

				sendNotification(project._id, {
					actor: {
						userId: req.user._id,
						name: req.user.name,
						pictureUrl: req.user.pictureUrl,
						color: req.user.color,
						email: req.user.email,
					},
					action: "update",
					object: "org.project.team",
					description: `Updated project member role of user '${transferredUser.name}' (${transferredUser.email}) to 'Admin'`,
					timestamp: Date.now(),
					data: projectWithTeam,
					identifiers: { orgId: project.orgId, projectId: project._id },
				});
			}

			// Log action
			auditCtrl.logAndNotify(
				originalUser._id,
				originalUser,
				"user",
				"update",
				`Transferred cluster ownership to user '${transferredUser.name}' (${transferredUser.email})`,
				originalUser
			);

			// Log action
			auditCtrl.logAndNotify(
				transferredUser._id,
				transferredUser,
				"user",
				"update",
				"Became the new cluster owner",
				transferredUser
			);
		} catch (error) {
			await userCtrl.rollback(session);
			helper.handleError(req, res, error);
		}
	}
);

export default router;
