import express from "express";
import prjCtrl from "../controllers/project.js";
import orgMemberCtrl from "../controllers/organizationMember.js";
import userCtrl from "../controllers/user.js";
import auditCtrl from "../controllers/audit.js";
import { applyRules } from "../schemas/organizationMember.js";
import { authSession } from "../middlewares/authSession.js";
import { checkContentType } from "../middlewares/contentType.js";
import { validateOrg } from "../middlewares/validateOrg.js";
import { authorizeOrgAction } from "../middlewares/authorizeOrgAction.js";
import { validate } from "../middlewares/validate.js";

import ERROR_CODES from "../config/errorCodes.js";

const router = express.Router({ mergeParams: true });

/*
@route      /v1/org/:orgId/member?role=&search&sortBy=email&sortDir=asc
@method     GET
@desc       Get organization members
@access     private
*/
router.get(
	"/:orgId/member",
	authSession,
	validateOrg,
	authorizeOrgAction("org.member.view"),
	async (req, res) => {
		try {
			const { org } = req;
			const { search, role, sortBy, sortDir } = req.query;

			let pipeline = [
				{
					$match: {
						orgId: helper.objectId(org._id),
					},
				},
				{
					$lookup: {
						from: "users",
						localField: "userId",
						foreignField: "_id",
						as: "user",
					},
				},
			];

			// Email or name search
			if (search && search !== "null") {
				pipeline.push({
					$match: {
						$or: [
							{
								"user.email": {
									$regex: helper.escapeStringRegexp(search),
									$options: "i",
								},
							},
							{
								"user.name": {
									$regex: helper.escapeStringRegexp(search),
									$options: "i",
								},
							},
						],
					},
				});
			}

			// Role filter
			if (role) {
				if (Array.isArray(role))
					pipeline.push({
						$match: {
							role: { $in: role },
						},
					});
				else
					pipeline.push({
						$match: {
							role: role,
						},
					});
			}

			// Sort rules (currently support role and createdAt fields)
			if (sortBy && sortDir) {
				pipeline.push({
					$sort: {
						[sortBy]: sortDir.toString().toLowerCase() === "desc" ? -1 : 1,
					},
				});
			} else
				pipeline.push({
					$sort: {
						createdAt: -1,
					},
				});

			let result = await orgMemberCtrl.aggregate(pipeline);
			res.json(
				result.map((entry) => {
					return {
						_id: entry._id,
						orgId: entry.orgId,
						role: entry.role,
						joinDate: entry.joinDate,
						member: {
							_id: entry.user[0]._id,
							iid: entry.user[0].iid,
							color: entry.user[0].color,
							name: entry.user[0].name,
							pictureUrl: entry.user[0].pictureUrl,
							email: entry.user[0].email,
							isOrgOwner:
								org.ownerUserId.toString() === entry.user[0]._id.toString(),
						},
					};
				})
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId/member/exclude-current?role=&search&sortBy=email&sortDir=asc
@method     GET
@desc       Get organization members excluding the current user making this request
@access     private
*/
router.get(
	"/:orgId/member/exclude-current",
	authSession,
	validateOrg,
	authorizeOrgAction("org.member.view"),
	async (req, res) => {
		try {
			const { user, org } = req;
			const { search, role, sortBy, sortDir } = req.query;

			let pipeline = [
				{
					$match: {
						orgId: helper.objectId(org._id),
						userId: { $ne: helper.objectId(user._id) },
					},
				},
				{
					$lookup: {
						from: "users",
						localField: "userId",
						foreignField: "_id",
						as: "user",
					},
				},
			];

			// Email or name search
			if (search && search !== "null") {
				pipeline.push({
					$match: {
						$or: [
							{
								"user.email": {
									$regex: helper.escapeStringRegexp(search),
									$options: "i",
								},
							},
							{
								"user.name": {
									$regex: helper.escapeStringRegexp(search),
									$options: "i",
								},
							},
						],
					},
				});
			}

			// Role filter
			if (role) {
				if (Array.isArray(role))
					pipeline.push({
						$match: {
							role: { $in: role },
						},
					});
				else
					pipeline.push({
						$match: {
							role: role,
						},
					});
			}

			// Sort rules (currently support role and createdAt fields)
			if (sortBy && sortDir) {
				pipeline.push({
					$sort: {
						[sortBy]: sortDir.toString().toLowerCase() === "desc" ? -1 : 1,
					},
				});
			} else
				pipeline.push({
					$sort: {
						createdAt: -1,
					},
				});

			let result = await orgMemberCtrl.aggregate(pipeline);
			res.json(
				result.map((entry) => {
					return {
						_id: entry._id,
						orgId: entry.orgId,
						role: entry.role,
						joinDate: entry.joinDate,
						member: {
							_id: entry.user[0]._id,
							iid: entry.user[0].iid,
							color: entry.user[0].color,
							name: entry.user[0].name,
							pictureUrl: entry.user[0].pictureUrl,
							email: entry.user[0].email,
							isOrgOwner:
								org.ownerUserId.toString() === entry.user[0]._id.toString(),
						},
					};
				})
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId/member/:userId
@method     PUT
@desc       Update role of organization member
@access     private
*/
router.put(
	"/:orgId/member/:userId",
	checkContentType,
	authSession,
	validateOrg,
	authorizeOrgAction("org.member.update"),
	applyRules("update-member-role"),
	validate,
	async (req, res) => {
		try {
			const { userId } = req.params;
			const { role } = req.body;

			// Check if there is such a user
			let user = await userCtrl.getOneById(userId);
			if (!user) {
				return res.status(404).json({
					error: t("Not Found"),
					details: t("No such user exists"),
					code: ERROR_CODES.notFound,
				});
			}

			// Check if the user is a member of the organization or not
			let member = await orgMemberCtrl.getOneByQuery(
				{
					orgId: req.org._id,
					userId: userId,
				},
				{ cacheKey: `${req.org._id}.${userId}` }
			);

			if (!member) {
				return res.status(404).json({
					error: t("Not a Member"),
					details: t(
						"User is not a member of the organization '%s'.",
						req.org.name
					),
					code: ERROR_CODES.notFound,
				});
			}

			// Check if the target user is the current user or not. Users cannot change their own role.
			if (req.user._id.toString() === user._id.toString()) {
				return res.status(422).json({
					error: t("Not Allowed"),
					details: t("You cannot change your own organization role."),
					code: ERROR_CODES.notAllowed,
				});
			}

			// Check if the target user is the organization owner. The role of organization owner cannot be changed.
			if (user._id.toString() === req.org.ownerUserId.toString()) {
				return res.status(422).json({
					error: t("Not Allowed"),
					details: t("You cannot change the role of the organization owner."),
					code: ERROR_CODES.notAllowed,
				});
			}

			// Update the role of the user
			let result = await orgMemberCtrl.updateOneById(
				member._id,
				{ role },
				{},
				{ cacheKey: `${req.org._id}.${userId}` }
			);

			result = {
				...result,
				member: {
					_id: user._id,
					iid: user.iid,
					color: user.color,
					name: user.name,
					pictureUrl: user.pictureUrl,
					email: user.email,
					isOrgOwner: req.org.ownerUserId.toString() === user._id.toString(),
				},
			};

			res.json(result);

			// Log action
			auditCtrl.logAndNotify(
				req.org._id,
				req.user,
				"org.member",
				"update",
				t(
					"Updated organization member role of user '%s' (%s) from '%s' to '%s'",
					user.name,
					user.email,
					member.role,
					role
				),
				result,
				{ orgId: req.org._id }
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId/member/:userId
@method     DELETE
@desc       Remove member from organization
@access     private
*/
router.delete(
	"/:orgId/member/:userId",
	checkContentType,
	authSession,
	validateOrg,
	authorizeOrgAction("org.member.delete"),
	applyRules("remove-member"),
	validate,
	async (req, res) => {
		const session = await orgMemberCtrl.startSession();
		try {
			const { userId } = req.params;

			// Check if there is such a user
			let user = await userCtrl.getOneById(userId);
			if (!user) {
				await orgMemberCtrl.endSession(session);
				return res.status(404).json({
					error: t("Not Found"),
					details: t("No such user exists"),
					code: ERROR_CODES.notFound,
				});
			}

			// Check if the user is a member of the organization or not
			let member = await orgMemberCtrl.getOneByQuery(
				{
					orgId: req.org._id,
					userId: userId,
				},
				{
					cacheKey: `${req.org._id}.${userId}`,
				}
			);

			if (!member) {
				await orgMemberCtrl.endSession(session);
				return res.status(404).json({
					error: t("Not a Member"),
					details: t(
						"User is not a member of the organization '%s'.",
						req.org.name
					),
					code: ERROR_CODES.notFound,
				});
			}

			// Check if the target user is the current user or not. Users cannot delete themselves from the org team, they need to leave from org team.
			if (req.user._id.toString() === user._id.toString()) {
				await orgMemberCtrl.endSession(session);
				return res.status(422).json({
					error: t("Not Allowed"),
					details: t(
						"You cannot remove yourself from the organization. Try to leave the organization team."
					),
					code: ERROR_CODES.notAllowed,
				});
			}

			// Check if the user is the owner of the organization or not
			if (req.org.ownerUserId.toString() === user._id.toString()) {
				await orgMemberCtrl.endSession(session);
				return res.status(422).json({
					error: t("Not Allowed"),
					details: t(
						"The organization owner cannot be removed from the organization team. If you would like to remove the current organization owner from the organization then the organization ownership needs to be transferred to another organization 'Admin' member."
					),
					code: ERROR_CODES.notAllowed,
				});
			}

			// Check to see if the user has project team memberships. If the user is member of a project then first the user needs to be removed from project teams.
			let projects = await prjCtrl.getManyByQuery({
				orgId: req.org._id,
				"team.userId": userId,
			});

			// Check if the removed user is a project owner or not
			for (let i = 0; i < projects.length; i++) {
				const project = projects[i];
				if (project.ownerUserId.toString() === user._id.toString()) {
					await orgMemberCtrl.endSession(session);
					return res.status(422).json({
						error: t("Not Allowed"),
						details: t(
							"You cannot remove a user who owns a project from the organization. The user first needs to transfer the project '%s' ownership to another project member with 'Admin' privileges.",
							project.name
						),
						code: ERROR_CODES.notAllowed,
					});
				}
			}

			// Remove user from project teams
			for (let i = 0; i < projects.length; i++) {
				const project = projects[i];
				await prjCtrl.pullObjectByQuery(
					project._id,
					"team",
					{ userId: user._id },
					{ updatedBy: req.user._id },
					{ cacheKey: project._id, session }
				);
			}

			// Remove user from the organization
			await orgMemberCtrl.deleteOneById(member._id, {
				session,
				cacheKey: `${req.org._id}.${userId}`,
			});

			// Commit changes
			await orgMemberCtrl.commit(session);
			res.json();

			// Log action
			await auditCtrl.logAndNotify(
				req.org._id,
				req.user,
				"org.member",
				"delete",
				t(
					"Removed user '%s' (%s) from organization team",
					user.name,
					user.email
				),
				{
					_id: user._id,
					iid: user.iid,
					color: user.color,
					name: user.name,
					pictureUrl: user.pictureUrl,
					email: user.email,
				},
				{ orgId: req.org._id }
			);
		} catch (error) {
			await orgMemberCtrl.rollback(session);
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId/member/delete-multi
@method     POST
@desc       Remove multiple members from organization
@access     private
*/
router.post(
	"/:orgId/member/delete-multi",
	checkContentType,
	authSession,
	validateOrg,
	authorizeOrgAction("org.member.delete"),
	applyRules("remove-members"),
	validate,
	async (req, res) => {
		const session = await orgMemberCtrl.startSession();
		try {
			const { userIds } = req.body;

			// Users cannot delete themselves from the org team, they need to leave from org team.
			if (userIds.includes(req.user._id.toString())) {
				await orgMemberCtrl.endSession(session);
				return res.status(422).json({
					error: t("Not Allowed"),
					details: t(
						"You cannot remove yourself from the organization. Try to leave the organization team."
					),
					code: ERROR_CODES.notAllowed,
				});
			}

			// Check if one of the deleted user is the owner of the organization or not
			if (userIds.includes(req.org.ownerUserId.toString())) {
				await orgMemberCtrl.endSession(session);
				return res.status(422).json({
					error: t("Not Allowed"),
					details: t(
						"The organization owner cannot be removed from the organization team. If you would like to remove the current organization owner from the organization, then the organization ownership needs to be transferred to another organization 'Admin' member."
					),
					code: ERROR_CODES.notAllowed,
				});
			}

			// Get the list of users that are removed from the organization
			let users = await userCtrl.getManyByQuery({
				_id: { $in: userIds },
			});

			// Check to see if the deleted users have project team memberships. If they have then we first need to remove them from the project teams.
			let projects = await prjCtrl.getManyByQuery({
				orgId: req.org._id,
				"team.userId": { $in: userIds },
			});

			// Check if any of the removed users is a project owner or not
			for (let i = 0; i < projects.length; i++) {
				const project = projects[i];
				if (userIds.includes(project.ownerUserId.toString())) {
					await orgMemberCtrl.endSession(session);
					return res.status(422).json({
						error: t("Not Allowed"),
						details: t(
							"You cannot remove a user who owns a project from the organization. The user first needs to transfer the project ownership to another project 'Admin' member."
						),
						code: ERROR_CODES.notAllowed,
					});
				}
			}

			// Remove users from project teams
			for (let i = 0; i < projects.length; i++) {
				const project = projects[i];
				await prjCtrl.pullObjectByQuery(
					project._id,
					"team",
					{ userId: { $in: userIds } },
					{ updatedBy: req.user._id },
					{ cacheKey: project._id, session }
				);
			}

			// Remove users from the organization
			await orgMemberCtrl.deleteManyByQuery(
				{ orgId: req.org._id, userId: { $in: userIds } },
				{
					session,
					cacheKey: userIds.map((entry) => `${req.org._id}.${entry}`),
				}
			);

			// Commit changes
			await orgMemberCtrl.commit(session);
			res.json();

			for (const removedUser of users) {
				// Log action
				await auditCtrl.logAndNotify(
					req.org._id,
					req.user,
					"org.member",
					"delete",
					t(
						"Removed user '%s' (%s) from organization team",
						removedUser.name,
						removedUser.email
					),
					{
						_id: removedUser._id,
						iid: removedUser.iid,
						color: removedUser.color,
						name: removedUser.name,
						pictureUrl: removedUser.pictureUrl,
						email: removedUser.email,
					},
					{ orgId: req.org._id }
				);
			}
		} catch (error) {
			await orgMemberCtrl.rollback(session);
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId/member
@method     DELETE
@desc       Leave organization team
@access     private
*/
router.delete(
	"/:orgId/member",
	checkContentType,
	authSession,
	validateOrg,
	async (req, res) => {
		const session = await orgMemberCtrl.startSession();
		try {
			const { user } = req;
			// Check if the user is a member of the organization or not
			let member = await orgMemberCtrl.getOneByQuery(
				{
					orgId: req.org._id,
					userId: user._id,
				},
				{
					cacheKey: `${req.org._id}.${user._id}`,
				}
			);

			if (!member) {
				await orgMemberCtrl.endSession(session);
				return res.status(404).json({
					error: t("Not a Member"),
					details: t(
						"You are not a member of the organization '%s'.",
						req.org.name
					),
					code: ERROR_CODES.notFound,
				});
			}

			// Check if the user is the owner of the organization or not
			if (req.org.ownerUserId.toString() === user._id) {
				await orgMemberCtrl.endSession(session);
				return res.status(422).json({
					error: t("Not Allowed"),
					details: t(
						"You are the owner of the organization. The organization owner cannot leave the organization team. You first need to transfer organization ownership to another organization 'Admin' member."
					),
					code: ERROR_CODES.notAllowed,
				});
			}

			// Check to see if the user has project team memberships. If the user is member of a project then first the user needs to be removed from project teams.
			let projects = await prjCtrl.getManyByQuery({
				orgId: req.org._id,
				"team.userId": user._id,
			});

			// Check if the removed user is a project owner or not
			for (let i = 0; i < projects.length; i++) {
				const project = projects[i];
				if (project.ownerUserId.toString() === user._id.toString()) {
					await orgMemberCtrl.endSession(session);
					return res.status(422).json({
						error: t("Not Allowed"),
						details: t(
							"You cannot leave the organization team, because you are owner of at least one project of the organization. You first need to transfer project '%s' ownership to another project member with 'Admin' privileges.",
							project.name
						),
						code: ERROR_CODES.notAllowed,
					});
				}
			}

			// Remove user from project teams
			for (let i = 0; i < projects.length; i++) {
				const project = projects[i];
				await prjCtrl.pullObjectByQuery(
					project._id,
					"team",
					{ userId: user._id },
					{ updatedBy: user._id },
					{ cacheKey: project._id, session }
				);
			}

			// Leave the organization team
			await orgMemberCtrl.deleteOneByQuery(
				{ orgId: req.org._id, userId: user._id },
				{
					cacheKey: `${req.org._id}.${user._id}`,
					session,
				}
			);

			// Commit changes
			await orgMemberCtrl.commit(session);
			res.json();

			// Log action
			await auditCtrl.logAndNotify(
				req.org._id,
				req.user,
				"org.member",
				"delete",
				t(
					"User '%s' (%s) has left the organization team",
					user.name,
					user.email
				),
				{
					_id: user._id,
					iid: user.iid,
					color: user.color,
					name: user.name,
					pictureUrl: user.pictureUrl,
					email: user.email,
				},
				{ orgId: req.org._id }
			);
		} catch (error) {
			await orgMemberCtrl.rollback(session);
			helper.handleError(req, res, error);
		}
	}
);

export default router;
