import express from "express";
import auditCtrl from "../controllers/audit.js";
import { AuditModel } from "../schemas/audit.js";
import { authSession } from "../middlewares/authSession.js";
import { validateOrg } from "../middlewares/validateOrg.js";
import { authorizeOrgAction } from "../middlewares/authorizeOrgAction.js";
import { applyRules } from "../schemas/audit.js";
import { validate } from "../middlewares/validate.js";

const router = express.Router({ mergeParams: true });

/*
@route      /v1/log/org/:orgId?page=0&size=50&action=&actor=&sortBy=createdAt&sortDir=desc&start&end&projectId&envId
@method     GET
@desc       Get audit trails
@access     private
*/
router.get(
	"/org/:orgId",
	authSession,
	validateOrg,
	authorizeOrgAction("org.viewLogs"),
	applyRules("view-logs"),
	validate,
	async (req, res) => {
		try {
			const { org } = req;
			const {
				page,
				size,
				action,
				actor,
				sortBy,
				sortDir,
				start,
				end,
				projectId,
				envId,
			} = req.query;

			let query = {
				orgId: org._id,
			};

			if (projectId) query.projectId = projectId;
			if (envId) query.environmentId = envId;

			// Action filter
			if (action) {
				if (Array.isArray(action)) query.action = { $in: action };
				else query.action = action;
			}

			// Actor filter
			if (actor) {
				if (Array.isArray(action)) query["actor.userId"] = { $in: actor };
				else query["actor.userId"] = actor;
			}

			if (start && !end) query.createdAt = { $gte: start };
			else if (!start && end) query.createdAt = { $lte: end };
			else if (start && end) query.createdAt = { $gte: start, $lte: end };

			let sort = {};
			if (sortBy && sortDir) {
				sort[sortBy] = sortDir;
			} else sort = { createdAt: "desc" };

			let logs = await auditCtrl.getManyByQuery(query, {
				sort,
				skip: size * page,
				limit: size,
				projection: { data: 0 },
			});

			res.json(logs);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/log/org/:orgId/filters?projectId=&envId=
@method     POST
@desc       Get distinct actions
@access     private
*/
router.get(
	"/org/:orgId/filters",
	authSession,
	validateOrg,
	authorizeOrgAction("org.viewLogs"),
	applyRules("view-filters"),
	validate,
	async (req, res) => {
		try {
			const { org } = req;
			const { projectId, envId } = req.query;

			let query = {
				orgId: org._id,
			};

			if (projectId) query.projectId = projectId;
			if (envId) query.environmentId = envId;

			let results = await AuditModel.find(query).distinct("action");

			res.json(results);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

export default router;
