import express from "express";
import orgMemberCtrl from "../controllers/organizationMember.js";
import userCtrl from "../controllers/user.js";
import orgInvitationCtrl from "../controllers/organizationInvitation.js";
import auditCtrl from "../controllers/audit.js";
import { applyRules } from "../schemas/organizationInvitation.js";
import { authSession } from "../middlewares/authSession.js";
import { checkContentType } from "../middlewares/contentType.js";
import { validateOrg } from "../middlewares/validateOrg.js";
import { authorizeOrgAction } from "../middlewares/authorizeOrgAction.js";
import { validate } from "../middlewares/validate.js";
import { sendMessage as sendNotification } from "../init/sync.js";
import helper from "../util/helper.js";

import ERROR_CODES from "../config/errorCodes.js";

const router = express.Router({ mergeParams: true });

/*
@route      /v1/org/:orgId/invite?&uiBaseURL=http://...
@method     POST
@desc       Invites user(s) to the organization
@access     private
*/
router.post(
	"/",
	checkContentType,
	authSession,
	validateOrg,
	authorizeOrgAction("org.invite.create"),
	applyRules("invite"),
	validate,
	async (req, res) => {
		try {
			const { user, org } = req;
			const { uiBaseURL } = req.query;

			// Prepare the invitations array to store in the database
			let invitations = [];
			let token = helper.generateSlug("tkn", 36);
			req.body.forEach((entry) => {
				invitations.push({
					orgId: org._id,
					email: entry.email,
					token: token,
					role: entry.role,
					link: `${uiBaseURL}/studio/redirect-handle?token=${token}&type=org-invite`,
					host: user,
				});
			});

			// Create invitations
			let result = await orgInvitationCtrl.createMany(invitations);

			res.json(result);

			// If there are already user accounts with provided emails then send them realtime notifications
			let matchingUsers = await userCtrl.getManyByQuery({
				email: { $in: invitations.map((entry) => entry.email) },
				status: "Active",
			});

			// Send realtime notifications to invited users with accounts
			matchingUsers.forEach((matchingUser) => {
				// Find the invitation entry matching the user's emails
				let invite = invitations.find(
					(entry) => entry.email === matchingUser.email
				);

				sendNotification(matchingUser._id, {
					actor: {
						userId: user._id,
						name: user.name,
						pictureUrl: user.pictureUrl,
						color: user.color,
						email: user.email,
					},
					action: "invite",
					object: "org.invite",
					description: `Invited you to join organization '${org.name}' with '${invite.role}' permissions`,
					timestamp: Date.now(),
					data: {
						token: invite.token,
					},
					identifiers: { orgId: org._id },
				});
			});

			// Log action
			auditCtrl.log(
				user,
				"org.invite",
				"create",
				`Invited users to organization '${org.name}'`,
				result,
				{ orgId: org._id }
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId/invite?token=tkn_...
@method     PUT
@desc       Updates the invitation role
@access     private
*/
router.put(
	"/",
	checkContentType,
	authSession,
	validateOrg,
	authorizeOrgAction("org.invite.update"),
	applyRules("update-invite"),
	validate,
	async (req, res) => {
		try {
			const { role } = req.body;
			const { token } = req.query;
			const { user, org } = req;

			let invite = await orgInvitationCtrl.getOneByQuery({ token });
			if (!invite) {
				return res.status(404).json({
					error: "Not Found",
					details: "No such invitation exists.",
					code: ERROR_CODES.notFound,
				});
			}

			if (invite.status !== "Pending") {
				return res.status(422).json({
					error: "Not Allowed",
					details:
						"Organization invitation role can only be changed for invites in 'pending' status.",
					code: ERROR_CODES.notAllowed,
				});
			}

			// All good, update the invitation
			let updatedInvite = await orgInvitationCtrl.updateOneByQuery(
				{ token },
				{ role }
			);

			res.json(updatedInvite);

			// If there is alreay a user account with provided email then send them realtime notifications
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
						email: user.email,
					},
					action: "invite",
					object: "org.invite",
					description: `Invited you to join organization '${org.name}' with '${role}' permissions`,
					timestamp: Date.now(),
					data: {
						token: invite.token,
					},
					identifiers: { orgId: org._id },
				});
			}

			// Log action
			auditCtrl.log(
				user,
				"org.invite",
				"update",
				`Updated invitation role of '${invite.email}' from '${invite.role}' to '${role}'`,
				updatedInvite,
				{ orgId: org._id }
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId/invite?token=tkn_...
@method     DELETE
@desc       Deletes the organization invitation
@access     private
*/
router.delete(
	"/",
	checkContentType,
	authSession,
	validateOrg,
	authorizeOrgAction("org.invite.delete"),
	applyRules("delete-invite"),
	validate,
	async (req, res) => {
		try {
			const { token } = req.query;
			const { user, org } = req;

			let invite = await orgInvitationCtrl.getOneByQuery({ token });
			if (!invite) {
				return res.status(404).json({
					error: "Not Found",
					details: "No such invitation exists.",
					code: ERROR_CODES.notFound,
				});
			}

			// Delete the organization invitation
			await orgInvitationCtrl.deleteOneById(invite._id);

			res.json();

			// Log action
			auditCtrl.log(
				user,
				"org.invite",
				"delete",
				`Deleted organization invitation to '${invite.email}'`,
				invite,
				{ orgId: org._id }
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId/invite/multi
@method     DELETE
@desc       Deletes multiple organization invitations
@access     private
*/
router.delete(
	"/multi",
	checkContentType,
	authSession,
	validateOrg,
	authorizeOrgAction("org.invite.delete"),
	applyRules("delete-invite-multi"),
	validate,
	async (req, res) => {
		try {
			const { tokens } = req.body;
			const { user, org } = req;

			// Delete the organization invitations
			await orgInvitationCtrl.deleteManyByQuery({ token: { $in: tokens } });

			res.json();

			// Log action
			auditCtrl.log(
				user,
				"org.invite",
				"delete",
				"Deleted multiple organization invitations",
				{ tokens },
				{ orgId: org._id }
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId/invite?page=0&size=10&status=&email=&role=&start=&end&sortBy=email&sortDir=asc
@method     GET
@desc       Get organization invitations
@access     private
*/
router.get(
	"/",
	authSession,
	validateOrg,
	authorizeOrgAction("org.invite.view"),
	applyRules("get-invites"),
	validate,
	async (req, res) => {
		try {
			const { page, size, status, email, role, start, end, sortBy, sortDir } =
				req.query;

			let query = { orgId: req.org._id };
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
			} else sort = { createdAt: "asc" };

			let invites = await orgInvitationCtrl.getManyByQuery(query, {
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
@route      /v1/org/:orgId/invite/list-eligible?page=0&size=10&email=&sortBy=email&sortDir=asc
@method     GET
@desc       Get eligible cluster members to invite to the organization
@access     private
*/
router.get(
	"/list-eligible",
	authSession,
	validateOrg,
	authorizeOrgAction("org.invite.view"),
	applyRules("get-invites"),
	validate,
	async (req, res) => {
		try {
			const { user, org } = req;
			const { page, size, search, sortBy, sortDir } = req.query;

			// Get current organization team
			let orgTeam = await orgMemberCtrl.getManyByQuery({ orgId: org._id });
			// We just need to get the cluster members that are not already a team member of the organization
			orgTeam = orgTeam.map((entry) => helper.objectId(entry.userId));
			// The current user is also not eligible for invitation
			orgTeam.push(helper.objectId(user._id));

			let query = { _id: { $nin: orgTeam }, status: "Active" };
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
