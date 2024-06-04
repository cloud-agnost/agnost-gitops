import express from "express";
import userCtrl from "../controllers/user.js";
import auditCtrl from "../controllers/audit.js";
import prjInvitationCtrl from "../controllers/projectInvitation.js";
import { authSession } from "../middlewares/authSession.js";
import { checkContentType } from "../middlewares/contentType.js";
import { validateOrg } from "../middlewares/validateOrg.js";
import { validateProject } from "../middlewares/validateProject.js";
import { authorizeProjectAction } from "../middlewares/authorizeProjectAction.js";
import { applyRules } from "../schemas/projectInvitation.js";
import { validate } from "../middlewares/validate.js";
import { sendMessage as sendNotification } from "../init/sync.js";
import helper from "../util/helper.js";

import ERROR_CODES from "../config/errorCodes.js";

const router = express.Router({ mergeParams: true });

/*
@route      /v1/org/:orgId/project/:projectId/invite?uiBaseURL=http://...
@method     POST
@desc       Invites user(s) to the project
@access     private
*/
router.post(
	"/",
	checkContentType,
	authSession,
	validateOrg,
	validateProject,
	authorizeProjectAction("project.invite.create"),
	applyRules("invite"),
	validate,
	async (req, res) => {
		try {
			const { user, org, project } = req;
			const { uiBaseURL } = req.query;

			// Prepare the invitations array to store in the database
			let invitations = [];
			req.body.forEach((entry) => {
				let token = helper.generateSlug("tkn", 36);
				invitations.push({
					orgId: org._id,
					projectId: project._id,
					email: entry.email,
					token: token,
					role: entry.role,
					orgRole: "Member",
					link: `${uiBaseURL}/studio/redirect-handle?token=${token}&type=project-invite`,
					host: user,
				});
			});

			// Create invitations
			let result = await prjInvitationCtrl.createMany(invitations);

			res.json(result);

			// If there are alreay user accounts with provided emails then send them realtime notifications
			let matchingUsers = await userCtrl.getManyByQuery({
				email: { $in: invitations.map((entry) => entry.email) },
				status: "Active",
			});

			// Send realtime notifications to invited users with accounts
			matchingUsers.forEach((matchingUser) => {
				// Find the invidation entry matching the user's emails
				let invite = invitations.find(
					(entry) => entry.email === matchingUser.email
				);

				sendNotification(matchingUser._id, {
					actor: {
						userId: user._id,
						name: user.name,
						pictureUrl: user.pictureUrl,
						color: user.color,
					},
					action: "invite",
					object: "org.project.invite",
					description: `Invited you to join project '${project.name}' in organization '${org.name}' with '${invite.role}' permissions`,
					timestamp: Date.now(),
					data: {
						token: invite.token,
					},
					identifiers: { orgId: org._id, projectId: project._id },
				});
			});

			// Log action
			auditCtrl.log(
				user,
				"org.project.invite",
				"create",
				`Invited users to project '${project.name}' in organization '${org.name}'`,
				result,
				{ orgId: org._id, projectId: project._id }
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/invite?token=tkn_...
@method     PUT
@desc       Updates the project invitation role
@access     private
*/
router.put(
	"/",
	checkContentType,
	authSession,
	validateOrg,
	validateProject,
	authorizeProjectAction("project.invite.update"),
	applyRules("update-invite"),
	validate,
	async (req, res) => {
		try {
			const { role } = req.body;
			const { token } = req.query;
			const { user, org, project } = req;

			let invite = await prjInvitationCtrl.getOneByQuery({ token });
			if (!invite) {
				return res.status(404).json({
					error: "Not Found",
					details: "No such project invitation exists.",
					code: ERROR_CODES.notFound,
				});
			}

			if (invite.status !== "Pending") {
				return res.status(422).json({
					error: "Not Allowed",
					details:
						"Invitation role can only be changed for invites in 'pending' status.",
					code: ERROR_CODES.notAllowed,
				});
			}

			// All good, update the invitation
			let updatedInvite = await prjInvitationCtrl.updateOneByQuery(
				{ token },
				{ role }
			);

			res.json(updatedInvite);

			// If there are alreay a user account with provided email then send them realtime notifications
			let matchingUser = await userCtrl.getOneByQuery({
				email: invite.email,
				status: "Active",
			});

			if (matchingUser) {
				sendNotification(matchingUser._id, {
					actor: {
						userId: user._id,
						name: user.name,
						pictureUrl: user.pictureUrl,
						color: user.color,
					},
					action: "invite",
					object: "org.project.invite",
					description: `Invited you to join project '${project.name}' in organization '${org.name}' with '${role}' permissions`,
					timestamp: Date.now(),
					data: {
						token: invite.token,
					},
					identifiers: { orgId: org._id, projectId: project._id },
				});
			}

			// Log action
			auditCtrl.log(
				user,
				"org.project.invite",
				"update",
				`Updated project invitation role of '${invite.email}' from '${invite.role}' to '${role}'`,
				updatedInvite,
				{ orgId: org._id, projectId: project._id }
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/invite?token=tkn_...
@method     DELETE
@desc       Deletes the project invitation to the user
@access     private
*/
router.delete(
	"/",
	checkContentType,
	authSession,
	validateOrg,
	validateProject,
	authorizeProjectAction("project.invite.delete"),
	applyRules("delete-invite"),
	validate,
	async (req, res) => {
		try {
			const { token } = req.query;
			const { user, org, project } = req;

			let invite = await prjInvitationCtrl.getOneByQuery({ token });
			if (!invite) {
				return res.status(404).json({
					error: "Not Found",
					details: "No such project invitation exists.",
					code: ERROR_CODES.notFound,
				});
			}

			// Delete the organization invitation
			await prjInvitationCtrl.deleteOneById(invite._id);

			res.json();

			// Log action
			auditCtrl.log(
				user,
				"org.project.invite",
				"delete",
				`Deleted project invitation to '${invite.email}'`,
				invite,
				{ orgId: org._id, projectId: project._id }
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/invite/multi
@method     DELETE
@desc       Deletes multiple project invitations
@access     private
*/
router.delete(
	"/multi",
	checkContentType,
	authSession,
	validateOrg,
	validateProject,
	authorizeProjectAction("project.invite.delete"),
	applyRules("delete-invite-multi"),
	validate,
	async (req, res) => {
		try {
			const { tokens } = req.body;
			const { user, org, project } = req;

			// Delete the project invitations
			await prjInvitationCtrl.deleteManyByQuery({ token: { $in: tokens } });

			res.json();

			// Log action
			auditCtrl.log(
				user,
				"org.project.invite",
				"delete",
				"Deleted multiple project invitations",
				{ tokens },
				{ orgId: org._id, projectId: project._id }
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/invite?page=0&size=10&status=&email=&role=&start=&end&sortBy=email&sortDir=asc
@method     GET
@desc       Get project invitations
@access     private
*/
router.get(
	"/",
	authSession,
	validateOrg,
	validateProject,
	authorizeProjectAction("project.invite.view"),
	applyRules("get-invites"),
	validate,
	async (req, res) => {
		try {
			const { org, project } = req;
			const { page, size, status, email, role, start, end, sortBy, sortDir } =
				req.query;

			let query = { orgId: org._id, projectId: project._id };
			if (email && email !== "null")
				query.email = {
					$regex: helper.escapeStringRegexp(email),
					$options: "i",
				};

			if (status) {
				if (Array.isArray(status)) query.status = { $in: status };
				else query.status = status;
			}

			if (role) {
				if (Array.isArray(role)) query.role = { $in: role };
				else query.role = role;
			}

			if (start && !end) query.createdAt = { $gte: start };
			else if (!start && end) query.createdAt = { $lte: end };
			else if (start && end) query.createdAt = { $gte: start, $lte: end };

			let sort = {};
			if (sortBy && sortDir) {
				sort[sortBy] = sortDir;
			} else sort = { createdAt: "desc" };

			let invites = await prjInvitationCtrl.getManyByQuery(query, {
				sort,
				skip: size * page,
				limit: size,
			});

			res.json(invites);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/invite/list-eligible?page=0&size=10&email=&sortBy=email&sortDir=asc
@method     GET
@desc       Get eligible cluster members to invite to the project
@access     private
*/
router.get(
	"/list-eligible",
	authSession,
	validateOrg,
	validateProject,
	authorizeProjectAction("project.team.view"),
	applyRules("list-eligible"),
	validate,
	async (req, res) => {
		try {
			const { user, project } = req;
			const { page, size, search, sortBy, sortDir } = req.query;

			// We just need to get the project members that are not already a team member of the project
			let projectTeam = project.team.map((entry) =>
				helper.objectId(entry.userId)
			);
			// The current user is also not eligible for invitation
			projectTeam.push(helper.objectId(user._id));

			let query = { _id: { $nin: projectTeam }, status: "Active" };
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
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

export default router;
