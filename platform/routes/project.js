import config from "config";
import express from "express";
import sharp from "sharp";
import prjCtrl from "../controllers/project.js";
import auditCtrl from "../controllers/audit.js";
import userCtrl from "../controllers/user.js";
import prjEnvCtrl from "../controllers/environment.js";
import cntrCtrl from "../controllers/container.js";
import { authSession } from "../middlewares/authSession.js";
import { checkContentType } from "../middlewares/contentType.js";
import { validateOrg } from "../middlewares/validateOrg.js";
import { validateProject } from "../middlewares/validateProject.js";
import { authorizeOrgAction } from "../middlewares/authorizeOrgAction.js";
import {
	authorizeProjectAction,
	projectAuthorization,
} from "../middlewares/authorizeProjectAction.js";
import { applyRules } from "../schemas/project.js";
import { validate } from "../middlewares/validate.js";
import { fileUploadMiddleware } from "../middlewares/handleFile.js";
import { storage } from "../init/storage.js";
import { createNamespace, deleteNamespaces } from "../handlers/ns.js";
import { deleteTCPProxyPorts } from "../handlers/tcpproxy.js";
import ERROR_CODES from "../config/errorCodes.js";
import helper from "../util/helper.js";

const router = express.Router({ mergeParams: true });

/*
@route      /v1/org/:orgId/project/roles
@method     GET
@desc       Get project role definitions
@access     private
*/
router.get("/roles", authSession, async (req, res) => {
	try {
		res.json(projectAuthorization);
	} catch (error) {
		helper.handleError(req, res, error);
	}
});

/*
@route      /v1/org/:orgId/project
@method     POST
@desc       Creates a new project. When creating the project a new default environment is also created and the project creator is added as 'Admin' to project team.
@access     private
*/
router.post(
	"/",
	checkContentType,
	authSession,
	validateOrg,
	authorizeOrgAction("org.project.create"),
	applyRules("create"),
	validate,
	async (req, res) => {
		// Start new database transaction session
		const session = await prjCtrl.startSession();
		try {
			const { org, user } = req;
			const { name, envName } = req.body;

			if (org.isClusterEntity) {
				return res.status(401).json({
					error: "Not Allowed",
					details: `You are not allowed to create a new project within organization '${org.name}' which is the default organization of the cluster.`,
					code: ERROR_CODES.notAllowed,
				});
			}

			// Create the new project and associated default environment
			const { project, environment } = await prjCtrl.createProject(
				session,
				user,
				org,
				name,
				envName
			);

			// Create the namespace in the Kubernetes cluster for the environment
			await createNamespace(environment);

			await prjCtrl.commit(session);

			// Set project team member information
			project.team[0].userId = user;

			res.json({
				project,
				environment,
			});

			// Log action
			auditCtrl.logAndNotify(
				org._id,
				user,
				"org.project",
				"create",
				`Created new project '${name}'`,
				{ project, environment },
				{ orgId: org._id, projectId: project._id }
			);
		} catch (err) {
			await prjCtrl.rollback(session);
			helper.handleError(req, res, err);
		}
	}
);

/*
@route      /v1/org/:orgId/project
@method     GET
@desc       Get projects where a user is member of
@access     private
*/
router.get(
	"/",
	authSession,
	validateOrg,
	authorizeOrgAction("org.project.view"),
	async (req, res) => {
		try {
			const { org, user } = req;
			let projects = [];

			// Cluster owner is by default Admin member of all projects
			if (user.isClusterOwner) {
				projects = await prjCtrl.getManyByQuery(
					{ orgId: org._id },
					{
						lookup: {
							path: "team.userId",
						},
					}
				);
				res.json(projects);
			} else {
				projects = await prjCtrl.getManyByQuery(
					{
						orgId: org._id,
						"team.userId": user._id,
					},
					{
						lookup: {
							path: "team.userId",
						},
					}
				);
				res.json(projects);
			}
		} catch (err) {
			helper.handleError(req, res, err);
		}
	}
);

/*
@route      /v1/org/:orgId/project/all
@method     GET
@desc       Get all projets of the organization 
@access     private
*/
router.get(
	"/all",
	authSession,
	validateOrg,
	authorizeOrgAction("org.project.viewAll"),
	async (req, res) => {
		try {
			const { org } = req;

			let projects = await prjCtrl.getManyByQuery(
				{
					orgId: org._id,
				},
				{
					lookup: {
						path: "team.userId",
					},
				}
			);

			res.json(projects);
		} catch (err) {
			helper.handleError(req, res, err);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId
@method     PUT
@desc       Upadate project name
@access     private
*/
router.put(
	"/:projectId",
	checkContentType,
	authSession,
	validateOrg,
	validateProject,
	authorizeProjectAction("project.update"),
	applyRules("update"),
	validate,
	async (req, res) => {
		try {
			const { org, user, project } = req;
			const { name } = req.body;

			// Update project name
			await prjCtrl.updateOneById(
				project._id,
				{ name, updatedBy: user._id },
				{},
				{ cacheKey: project._id }
			);

			let projectWithTeam = await prjCtrl.getOneById(project._id, {
				lookup: {
					path: "team.userId",
				},
			});

			res.json(projectWithTeam);

			// Log action
			auditCtrl.logAndNotify(
				project._id,
				user,
				"org.project",
				"update",
				`Updated the name of project from '${project.name}' to '${name}'`,
				projectWithTeam,
				{ orgId: org._id, projectId: project._id }
			);
		} catch (err) {
			helper.handleError(req, res, err);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/picture?width=128&height=128
@method     PUT
@desc       Updates the profile image of the project. A picture with the name 'picture' needs to be uploaded in body of the request.
@access     private
*/
router.put(
	"/:projectId/picture",
	fileUploadMiddleware,
	authSession,
	validateOrg,
	validateProject,
	authorizeProjectAction("project.update"),
	applyRules("upload-picture"),
	validate,
	async (req, res) => {
		try {
			let buffer = req.file?.buffer;
			let { width, height } = req.query;
			if (!width) width = config.get("general.profileImgSizePx");
			if (!height) height = config.get("general.profileImgSizePx");

			if (!req.file) {
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
			await storage.deleteFile(uploadBucket, req.project.pictureUrl);
			// Save the new file
			const filePath = `storage/avatars/${helper.generateSlug("img", 6)}-${
				req.file.originalname
			}`;

			const metaData = {
				"Content-Type": req.file.mimetype,
			};
			await storage.saveFile(uploadBucket, filePath, buffer, metaData);

			// Update project with the new profile image url
			await prjCtrl.updateOneById(
				req.project._id,
				{
					pictureUrl: filePath,
					updatedBy: req.user._id,
				},
				{},
				{ cacheKey: req.project._id }
			);

			let projectWithTeam = await prjCtrl.getOneById(req.project._id, {
				lookup: {
					path: "team.userId",
				},
			});

			res.json(projectWithTeam);

			// Log action
			auditCtrl.logAndNotify(
				req.project._id,
				req.user,
				"org.project",
				"update",
				"Updated project picture",
				projectWithTeam,
				{ orgId: req.org._id, projectId: req.project._id }
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/picture
@method     DELETE
@desc       Removes the profile picture of the project.
@access     private
*/
router.delete(
	"/:projectId/picture",
	authSession,
	validateOrg,
	validateProject,
	authorizeProjectAction("project.update"),
	validate,
	async (req, res) => {
		try {
			// Delete existing file if it exists
			const uploadBucket = config.get("general.storageBucket");
			storage.deleteFile(uploadBucket, req.project.pictureUrl);

			// Remove the profile picture of the project
			await prjCtrl.updateOneById(
				req.project._id,
				{ updatedBy: req.user._id },
				{ pictureUrl: 1 },
				{ cacheKey: req.project._id }
			);

			let projectWithTeam = await prjCtrl.getOneById(req.project._id, {
				lookup: {
					path: "team.userId",
				},
			});

			res.json(projectWithTeam);

			// Log action
			auditCtrl.logAndNotify(
				req.project._id,
				req.user,
				"org.project",
				"update",
				"Removed project picture",
				projectWithTeam,
				{ orgId: req.org._id, projectId: req.project._id }
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId
@method     GET
@desc       Get specific project of a user whom is a member of
@access     private
*/
router.get(
	"/:projectId",
	authSession,
	validateOrg,
	validateProject,
	authorizeProjectAction("project.view"),
	async (req, res) => {
		try {
			const { project } = req;

			let projectWithTeam = await prjCtrl.getOneById(project._id, {
				lookup: {
					path: "team.userId",
				},
			});

			res.json(projectWithTeam);
		} catch (err) {
			helper.handleError(req, res, err);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId
@method     DELETE
@desc       Delete specific project of a user whom is a member of. Only project creators or cluster owner can delete the project.
@access     private
*/
router.delete(
	"/:projectId",
	checkContentType,
	authSession,
	validateOrg,
	validateProject,
	authorizeProjectAction("project.delete"),
	async (req, res) => {
		const session = await prjCtrl.startSession();

		try {
			const { org, project, user } = req;

			if (
				project.ownerUserId.toString() !== req.user._id.toString() &&
				!req.user.isClusterOwner
			) {
				return res.status(401).json({
					error: "Not Authorized",
					details: `You are not authorized to delete project '${project.name}'. Only the owner of the project or cluster owner can delete it.`,
					code: ERROR_CODES.unauthorized,
				});
			}

			if (project.isClusterEntity) {
				return res.status(401).json({
					error: "Not Allowed",
					details: `You are not allowed to delete project '${project.name}' which is the default project of the cluster.`,
					code: ERROR_CODES.notAllowed,
				});
			}

			const environments = await prjEnvCtrl.getManyByQuery({
				projectId: project._id,
			});
			const environmentiids = environments.map((env) => env.iid);

			const containers = await cntrCtrl.getManyByQuery({
				projectId: project._id,
				"networking.tcpProxy.enabled": true,
				"networking.tcpProxy.publicPort": { $exists: true },
			});
			const tcpProxyPorts = containers.map(
				(c) => c.networking.tcpProxy.publicPort
			);

			// Delete all project related data, associted environments and containers
			await prjCtrl.deleteProject(session, org, project);

			// Delete namespaces
			await deleteNamespaces(environmentiids);
			// Remove exposed TCP proxy ports
			await deleteTCPProxyPorts(tcpProxyPorts);

			// Commit transaction
			await prjCtrl.commit(session);

			res.json();

			// Log action
			auditCtrl.logAndNotify(
				project._id,
				user,
				"org.project",
				"delete",
				`Deleted project '${project.name}'`,
				{},
				{ orgId: org._id, projectId: project._id }
			);
		} catch (err) {
			await prjCtrl.rollback(session);
			helper.handleError(req, res, err);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/transfer/:userId
@method     POST
@desc       Transfers project ownership to an existing project member.
@access     private
*/
router.post(
	"/:projectId/transfer/:userId",
	checkContentType,
	authSession,
	validateOrg,
	validateProject,
	authorizeProjectAction("project.transfer"),
	applyRules("transfer"),
	validate,
	async (req, res) => {
		try {
			const { org, user, project } = req;

			// Get transferred user information
			let transferredUser = await userCtrl.getOneById(req.params.userId);

			await prjCtrl.updateOneById(
				project._id,
				{ ownerUserId: req.params.userId, updatedBy: user._id },
				{},
				{ cacheKey: project._id }
			);

			let projectWithTeam = await prjCtrl.getOneById(project._id, {
				lookup: {
					path: "team.userId",
				},
			});

			res.json(projectWithTeam);

			// Log action
			auditCtrl.logAndNotify(
				project._id,
				user,
				"org.project.team",
				"update",
				`Transferred project ownership to '${transferredUser.name}' (${transferredUser.email})`,
				projectWithTeam,
				{ orgId: org._id, projectId: project._id }
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

export default router;
