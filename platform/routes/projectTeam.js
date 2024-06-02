import express from "express";
import prjCtrl from "../controllers/project.js";
import userCtrl from "../controllers/user.js";
import auditCtrl from "../controllers/audit.js";
import { authSession } from "../middlewares/authSession.js";
import { checkContentType } from "../middlewares/contentType.js";
import { validateOrg } from "../middlewares/validateOrg.js";
import { validateProject } from "../middlewares/validateProject.js";
import { authorizeProjectAction } from "../middlewares/authorizeProjectAction.js";
import { applyRules } from "../schemas/project.js";
import { validate } from "../middlewares/validate.js";

import ERROR_CODES from "../config/errorCodes.js";

const router = express.Router({ mergeParams: true });

/*
@route      /v1/org/:orgId/project/:projectId/team
@method     GET
@desc       Get project team members
@access     private
*/
router.get(
	"/",
	authSession,
	validateOrg,
	validateProject,
	authorizeProjectAction("project.team.view"),
	async (req, res) => {
		try {
			const { project } = req;

			let projectTeam = await prjCtrl.getOneById(project._id, {
				lookup: "team.userId",
			});

			res.json(
				projectTeam.team.map((entry) => {
					return {
						_id: entry._id,
						projectId: project._id,
						role: entry.role,
						joinDate: entry.joinDate,
						member: {
							_id: entry.userId._id,
							iid: entry.userId.iid,
							color: entry.userId.color,
							name: entry.userId.name,
							pictureUrl: entry.userId.pictureUrl,
							email: entry.userId.email,
							isProjectOwner:
								project.ownerUserId.toString() === entry.userId._id.toString(),
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
@route      /v1/org/:orgId/project/:projectId/team/me
@method     GET
@desc       Get current user's project team membership info
@access     private
*/
router.get(
	"/me",
	authSession,
	validateOrg,
	validateProject,
	authorizeProjectAction("project.team.view"),
	async (req, res) => {
		try {
			const { user, project } = req;

			let projectTeam = await prjCtrl.getOneById(project._id, {
				lookup: "team.userId",
			});

			let processedList = projectTeam.team
				.filter((entry) => entry.userId._id.toString() === user._id.toString())
				.map((entry) => {
					return {
						_id: entry._id,
						projectId: project._id,
						role: entry.role,
						joinDate: entry.joinDate,
						member: {
							_id: entry.userId._id,
							iid: entry.userId.iid,
							color: entry.userId.color,
							name: entry.userId.name,
							pictureUrl: entry.userId.pictureUrl,
							isProjectOwner:
								project.ownerUserId.toString() === entry.userId._id.toString(),
						},
					};
				});

			res.json(processedList.length > 0 ? processedList[0] : undefined);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/team/:userId
@method     PUT
@desc       Update role of team member
@access     private
*/
router.put(
	"/:userId",
	checkContentType,
	authSession,
	validateOrg,
	validateProject,
	authorizeProjectAction("project.team.update"),
	applyRules("update-member-role"),
	validate,
	async (req, res) => {
		try {
			const { project, user, org } = req;
			const { userId } = req.params;
			const { role } = req.body;

			// Check if there is such a user
			let targetUser = await userCtrl.getOneById(userId);
			if (!targetUser) {
				return res.status(404).json({
					error: t("Not Found"),
					details: t("No such user exists"),
					code: ERROR_CODES.notFound,
				});
			}

			// Check if the user is a member of the project or not
			let member = project.team.find(
				(entry) => entry.userId.toString() === userId
			);
			if (!member) {
				return res.status(404).json({
					error: t("Not a Member"),
					details: t("User is not a member of the project '%s'.", project.name),
					code: ERROR_CODES.notFound,
				});
			}

			// Check if the target user is the current user or not. Users cannot change their own role.
			if (targetUser._id.toString() === user._id.toString()) {
				return res.status(422).json({
					error: t("Not Allowed"),
					details: t("You cannot change your own project role."),
					code: ERROR_CODES.notAllowed,
				});
			}

			// Check if the target user is the project owner. The role of project owner cannot be changed.
			if (targetUser._id.toString() === project.ownerUserId.toString()) {
				return res.status(422).json({
					error: t("Not Allowed"),
					details: t("You cannot change the role of the project owner."),
					code: ERROR_CODES.notAllowed,
				});
			}

			// Update the role of the user
			await prjCtrl.updateOneByQuery(
				{ _id: project._id, "team._id": member._id },
				{
					"team.$.role": role,
					updatedBy: user._id,
				},
				{},
				{ cacheKey: project._id }
			);

			let result = {
				_id: member._id,
				projectId: project._id,
				role: role,
				joinDate: member.joinDate,
				member: {
					_id: targetUser._id,
					iid: targetUser.iid,
					color: targetUser.color,
					name: targetUser.name,
					pictureUrl: targetUser.pictureUrl,
					email: targetUser.email,
					isProjectOwner:
						project.ownerUserId.toString() === targetUser._id.toString(),
				},
			};

			res.json(result);

			let projectWithTeam = await prjCtrl.getOneById(project._id, {
				lookup: {
					path: "team.userId",
				},
			});

			// Log action
			auditCtrl.logAndNotify(
				project._id,
				req.user,
				"org.project.team",
				"update",
				t(
					"Updated project member role of user '%s' (%s) from '%s' to '%s'",
					targetUser.name,
					targetUser.email,
					member.role,
					role
				),
				projectWithTeam,
				{ orgId: org._id, projectId: project._id }
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/team/:userId
@method     DELETE
@desc       Remove member from project team
@access     private
*/
router.delete(
	"/:userId",
	checkContentType,
	authSession,
	validateOrg,
	validateProject,
	authorizeProjectAction("project.team.delete"),
	applyRules("remove-member"),
	validate,
	async (req, res) => {
		try {
			const { org, project } = req;
			const { userId } = req.params;

			// Check if there is such a user
			let user = await userCtrl.getOneById(userId);
			if (!user) {
				return res.status(404).json({
					error: t("Not Found"),
					details: t("No such user exists"),
					code: ERROR_CODES.notFound,
				});
			}

			// Check if the user is a member of the project or not
			let member = project.team.find(
				(entry) => entry.userId.toString() === userId
			);

			if (!member) {
				return res.status(404).json({
					error: t("Not a Member"),
					details: t("User is not a member of the project '%s'.", project.name),
					code: ERROR_CODES.notFound,
				});
			}

			// Check if the target user is the current user or not. Users cannot delete themselves from the project team, they need to leave from project team.
			if (req.user._id.toString() === user._id.toString()) {
				return res.status(422).json({
					error: t("Not Allowed"),
					details: t(
						"You cannot remove yourself from the project team. Try to leave the project team."
					),
					code: ERROR_CODES.notAllowed,
				});
			}

			// Check if the user is the creator of the project or not
			if (project.ownerUserId.toString() === userId) {
				return res.status(422).json({
					error: t("Not Allowed"),
					details: t(
						"The project owner cannot be removed from the project team. If you would like to remove the current project owner from the project team then the project ownership needs to be transferred to another team member with 'Admin' role"
					),
					code: ERROR_CODES.notAllowed,
				});
			}

			// Remove user from the project team
			await prjCtrl.pullObjectById(
				project._id,
				"team",
				member._id,
				{ updatedBy: user._id },
				{ cacheKey: project._id }
			);

			res.json();

			let projectWithTeam = await prjCtrl.getOneById(project._id, {
				lookup: {
					path: "team.userId",
				},
			});

			// Log action
			auditCtrl.logAndNotify(
				project._id,
				req.user,
				"org.project.team",
				"delete",
				t("Removed user '%s' (%s) from project team", user.name, user.email),
				projectWithTeam,
				{ orgId: org._id, projectId: project._id }
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/team/delete-multi
@method     POST
@desc       Remove multiple members from project team
@access     private
*/
router.post(
	"/delete-multi",
	checkContentType,
	authSession,
	validateOrg,
	validateProject,
	authorizeProjectAction("project.team.delete"),
	applyRules("remove-members"),
	validate,
	async (req, res) => {
		try {
			const { org, project } = req;
			const { userIds } = req.body;

			// Users cannot remove themselves from the project team, they need to leave from org team.
			if (userIds.includes(req.user._id.toString())) {
				return res.status(422).json({
					error: t("Not Allowed"),
					details: t(
						"You cannot remove yourself from the project team. Try to leave the project team."
					),
					code: ERROR_CODES.notAllowed,
				});
			}

			// Check if one of the deleted user is the owner of the project or not
			if (userIds.includes(project.ownerUserId.toString())) {
				return res.status(422).json({
					error: t("Not Allowed"),
					details: t(
						"The project owner cannot be removed from the project team. If you would like to remove the current project owner from the project team, then the project ownership needs to be transferred to another team member with 'Admin' role"
					),
					code: ERROR_CODES.notAllowed,
				});
			}

			// Remove users from the project team
			await prjCtrl.pullObjectByQuery(
				project._id,
				"team",
				{ userId: { $in: userIds } },
				{ updatedBy: req.user._id },
				{ cacheKey: project._id }
			);

			res.json();

			let projectWithTeam = await prjCtrl.getOneById(project._id, {
				lookup: {
					path: "team.userId",
				},
			});

			// Log action
			auditCtrl.logAndNotify(
				project._id,
				req.user,
				"org.project.team",
				"delete",
				t("Removed users from project team"),
				projectWithTeam,
				{ orgId: org._id, projectId: project._id }
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/team
@method     DELETE
@desc       Leave the project team
@access     private
*/
router.delete(
	"/",
	checkContentType,
	authSession,
	validateOrg,
	validateProject,
	async (req, res) => {
		try {
			const { org, project, user } = req;

			// Check if the user is a member of the project or not
			let member = project.team.find(
				(entry) => entry.userId.toString() === user._id.toString()
			);

			if (!member) {
				return res.status(404).json({
					error: t("Not a Member"),
					details: t(
						"You are not a member of the project '%s' team.",
						project.name
					),
					code: ERROR_CODES.notFound,
				});
			}

			// Check if the user is the creator of the project or not
			if (project.ownerUserId.toString() === user._id) {
				return res.status(422).json({
					error: t("Not Allowed"),
					details: t(
						"You are the owner of the project. The project owner cannot leave the project team. You first need to transfer project ownership to another team member with 'Admin' role."
					),
					code: ERROR_CODES.notAllowed,
				});
			}

			// Leave the project team
			await prjCtrl.pullObjectById(
				project._id,
				"team",
				member._id,
				{ updatedBy: user._id },
				{ cacheKey: project._id }
			);

			res.json();

			let projectWithTeam = await prjCtrl.getOneById(project._id, {
				lookup: {
					path: "team.userId",
				},
			});

			// Log action
			auditCtrl.logAndNotify(
				project._id,
				user,
				"org.project.team",
				"delete",
				t("User '%s' (%s) has left the project team", user.name, user.email),
				projectWithTeam,
				{ orgId: org._id, projectId: project._id }
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

export default router;
