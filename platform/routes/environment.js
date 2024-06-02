import express from "express";
import auditCtrl from "../controllers/audit.js";
import prjEnvCtrl from "../controllers/environment.js";
import cntrCtrl from "../controllers/container.js";
import { authSession } from "../middlewares/authSession.js";
import { checkContentType } from "../middlewares/contentType.js";
import { validateOrg } from "../middlewares/validateOrg.js";
import { validateProject } from "../middlewares/validateProject.js";
import { validateEnvironment } from "../middlewares/validateEnvironment.js";
import { authorizeProjectAction } from "../middlewares/authorizeProjectAction.js";
import { applyRules } from "../schemas/environment.js";
import { validate } from "../middlewares/validate.js";
import { createNamespace, deleteNamespaces } from "../handlers/ns.js";
import { deleteTCPProxyPorts } from "../handlers/tcpproxy.js";

import ERROR_CODES from "../config/errorCodes.js";

const router = express.Router({ mergeParams: true });

/*
@route      /v1/org/:orgId/project/:projectId/env
@method     GET
@desc       Get all project environments that are visible to the user
@access     private
*/
router.get(
	"/",
	authSession,
	validateOrg,
	validateProject,
	authorizeProjectAction("project.environment.view"),
	async (req, res) => {
		try {
			const { project, projectMember } = req;

			let query = { projectId: project._id };
			if (projectMember.role !== "Admin")
				query.$or = [
					{ private: false },
					{ $and: [{ private: true }, { createdBy: req.user._id }] },
				];

			let environments = await prjEnvCtrl.getManyByQuery(query, {
				sort: { name: "asc" },
			});

			res.json(environments);
		} catch (err) {
			helper.handleError(req, res, err);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/env/mine
@method     GET
@desc       Get the project environments creted by the user
@access     private
*/
router.get(
	"/mine",
	authSession,
	validateOrg,
	validateProject,
	authorizeProjectAction("project.environment.view"),
	async (req, res) => {
		try {
			const { project, projectMember } = req;

			let query = { projectId: project._id, createdBy: req.user._id };
			if (projectMember.role !== "Admin")
				query.$or = [
					{ private: false },
					{ $and: [{ private: true }, { createdBy: req.user._id }] },
				];

			let environments = await prjEnvCtrl.getManyByQuery(query, {
				sort: { name: "asc" },
			});

			res.json(environments);
		} catch (err) {
			helper.handleError(req, res, err);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/env
@method     POST
@desc       Creates a new blank project environment.
@access     private
*/
router.post(
	"/",
	checkContentType,
	authSession,
	validateOrg,
	validateProject,
	authorizeProjectAction("project.environment.create"),
	applyRules("create"),
	validate,
	async (req, res) => {
		// Start new database transaction session
		const session = await prjEnvCtrl.startSession();
		try {
			const { org, user, project } = req;
			const { name, readOnly } = req.body;

			if (project.isClusterEntity) {
				return res.status(401).json({
					error: t("Not Allowed"),
					details: t(
						"You are not allowed to create a new environment within project '%s' which is the default project of the cluster.",
						project.name
					),
					code: ERROR_CODES.notAllowed,
				});
			}

			const environmentId = helper.generateId();
			const environment = await prjEnvCtrl.create(
				{
					_id: environmentId,
					orgId: org._id,
					projectId: project._id,
					iid: helper.generateSlug("env"),
					name: name,
					private: req.body.private,
					readOnly: readOnly,
					createdBy: user._id,
					isClusterEntity: false,
				},
				{ session, cacheKey: environmentId }
			);

			// Create the Kubernetes namespace of the environment
			await createNamespace(environment);

			// Commit transaction
			await prjEnvCtrl.commit(session);

			res.json(environment);

			// Log action
			auditCtrl.logAndNotify(
				project._id,
				user,
				"org.project.environment",
				"create",
				t("Created a new blank project environment '%s'", name),
				environment,
				{
					orgId: org._id,
					projectId: project._id,
					environmentId: environment._id,
				}
			);
		} catch (error) {
			await prjEnvCtrl.rollback(session);
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/env/:envId
@method     GET
@desc       Returns a specific project environment
@access     private
*/
router.get(
	"/:envId",
	authSession,
	validateOrg,
	validateProject,
	validateEnvironment,
	authorizeProjectAction("project.environment.view"),
	async (req, res) => {
		try {
			const { environment } = req;

			res.json(environment);
		} catch (err) {
			helper.handleError(req, res, err);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/env/:envId
@method     PUT
@desc       Updates the environment name, private and readOnly flags
@access     private
*/
router.put(
	"/:envId",
	checkContentType,
	authSession,
	validateOrg,
	validateProject,
	validateEnvironment,
	authorizeProjectAction("project.environment.update"),
	applyRules("update"),
	validate,
	async (req, res) => {
		try {
			const { org, user, project, environment } = req;
			const { name, readOnly } = req.body;

			let updatedEnvironment = await prjEnvCtrl.updateOneById(
				environment._id,
				{
					name,
					private: req.body.private,
					readOnly,
					updatedBy: user._id,
				},
				{},
				{ cacheKey: environment._id }
			);

			res.json(updatedEnvironment);

			// Log action
			auditCtrl.logAndNotify(
				project._id,
				user,
				"org.project.environment",
				"update",
				t("Updated project environment '%s' properties", name),
				updatedEnvironment,
				{
					orgId: org._id,
					projectId: project._id,
					environmentId: environment._id,
				}
			);
		} catch (err) {
			helper.handleError(req, res, err);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/env/:envId
@method     DELETE
@desc       Deletes the project environment
@access     private
*/
router.delete(
	"/:envId",
	authSession,
	validateOrg,
	validateProject,
	validateEnvironment,
	authorizeProjectAction("project.environment.delete"),
	async (req, res) => {
		const session = await prjEnvCtrl.startSession();
		try {
			const { org, user, project, environment, projectMember } = req;

			// Get all the environments of the project
			const environments = await prjEnvCtrl.getManyByQuery(
				{ projectId: project._id },
				{ projection: { iid: 1 } }
			);

			if (environments.length === 1) {
				return res.status(401).json({
					error: t("Not Allowed"),
					details: t(
						"The project '%s' has only one environment left. You cannot delete the last environment of a project.",
						project.name
					),
					code: ERROR_CODES.notAllowed,
				});
			}

			if (
				environment.createdBy.toString() !== req.user._id.toString() &&
				projectMember.role !== "Admin"
			) {
				return res.status(401).json({
					error: t("Not Authorized"),
					details: t(
						"You are not authorized to delete project environment '%s'. Only the creator of the environment or project team members with 'Admin' role can delete it.",
						environment.name
					),
					code: ERROR_CODES.unauthorized,
				});
			}

			if (environment.isClusterEntity) {
				return res.status(401).json({
					error: t("Not Allowed"),
					details: t(
						"You are not allowed to delete environment '%s' which is the default environment of the cluster.",
						project.name
					),
					code: ERROR_CODES.notAllowed,
				});
			}

			const containers = await cntrCtrl.getManyByQuery({
				environmentId: environment._id,
				"networking.tcpProxy.enabled": true,
				"networking.tcpProxy.publicPort": { $exists: true },
			});

			const tcpProxyPorts = containers.map(
				(c) => c.networking.tcpProxy.publicPort
			);

			// Delete all environment related data
			await prjEnvCtrl.deleteEnvironment(session, org, project, environment);

			// Delete namespaces
			await deleteNamespaces([environment.iid]);
			// Remove exposed TCP proxy ports
			await deleteTCPProxyPorts(tcpProxyPorts);

			// Commit the database transaction
			await prjEnvCtrl.commit(session);

			res.json();

			// Log action
			auditCtrl.logAndNotify(
				project._id,
				user,
				"org.project.environment",
				"delete",
				t("Deleted project environment '%s'", environment.name),
				{},
				{
					orgId: org._id,
					projectId: project._id,
					environmentId: environment._id,
				}
			);
		} catch (err) {
			await prjEnvCtrl.rollback(session);
			helper.handleError(req, res, err);
		}
	}
);

export default router;
