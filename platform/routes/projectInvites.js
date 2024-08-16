import express from "express";
import auditCtrl from "../controllers/audit.js";
import prjInvitationCtrl from "../controllers/projectInvitation.js";
import { authSession } from "../middlewares/authSession.js";
import { checkContentType } from "../middlewares/contentType.js";
import { validateOrg } from "../middlewares/validateOrg.js";
import { validateProject } from "../middlewares/validateProject.js";
import { authorizeProjectAction } from "../middlewares/authorizeProjectAction.js";
import { applyRules } from "../schemas/projectInvitation.js";
import { validate } from "../middlewares/validate.js";
import helper from "../util/helper.js";

import ERROR_CODES from "../config/errorCodes.js";

const router = express.Router({ mergeParams: true });

/*
@route      /v1/org/:orgId/project/:projectId/invite?uiBaseURL=http://...
@method     POST
@desc       Creates invitations to the project
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
					name: entry.name,
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

			// Log action
			auditCtrl.log(
				user,
				"org.project.invite",
				"create",
				`Created invitations to project '${project.name}' in organization '${org.name}'`,
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
@route      /v1/org/:orgId/project/:projectId/invite?page=0&size=10&status=&name=&role=&start=&end&sortBy=name&sortDir=asc
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
			const { page, size, status, name, role, start, end, sortBy, sortDir } =
				req.query;

			let query = { orgId: org._id, projectId: project._id };
			if (name && name !== "null")
				query.name = {
					$regex: helper.escapeStringRegexp(name),
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
			} else sort = { createdAt: "asc" };

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

export default router;
