import config from "config";
import express from "express";
import sharp from "sharp";
import orgCtrl from "../controllers/organization.js";
import orgMemberCtrl from "../controllers/organizationMember.js";
import userCtrl from "../controllers/user.js";
import auditCtrl from "../controllers/audit.js";
import prjEnvCtrl from "../controllers/environment.js";
import cntrCtrl from "../controllers/container.js";
import { applyRules } from "../schemas/organization.js";
import { authSession } from "../middlewares/authSession.js";
import { checkContentType } from "../middlewares/contentType.js";
import { validateOrg } from "../middlewares/validateOrg.js";
import {
	authorizeOrgAction,
	orgAuthorization,
} from "../middlewares/authorizeOrgAction.js";
import { validate } from "../middlewares/validate.js";
import { fileUploadMiddleware } from "../middlewares/handleFile.js";
import { storage } from "../init/storage.js";
import { deleteNamespaces } from "../handlers/ns.js";
import { deleteTCPProxyPorts } from "../handlers/tcpproxy.js";
import helper from "../util/helper.js";

import ERROR_CODES from "../config/errorCodes.js";

const router = express.Router({ mergeParams: true });

/*
@route      /v1/org/roles
@method     GET
@desc       Get organization role definitions
@access     private
*/
router.get("/roles", authSession, async (req, res) => {
	try {
		res.json(orgAuthorization);
	} catch (error) {
		helper.handleError(req, res, error);
	}
});

/*
@route      /v1/org
@method     GET
@desc       Get all organizations where a user is a member of (sorted by organization name ascending)
@access     private
*/
router.get("/", authSession, async (req, res) => {
	try {
		const { user } = req;
		let orgs = [];

		// Cluster owner is by default Admin member of all organizations
		if (user.isClusterOwner) {
			orgs = await orgCtrl.getManyByQuery({ isClusterEntity: false });
			res.json(
				orgs
					.map((entry) => {
						return { ...entry, role: "Admin" };
					})
					.sort((a, b) =>
						a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
					)
			);
		} else {
			orgs = await orgMemberCtrl.getManyByQuery(
				{ userId: user._id },
				{ lookup: "orgId" }
			);
			res.json(
				orgs
					.filter((entry) => entry.orgId.isClusterEntity === false)
					.map((entry) => {
						return { ...entry.orgId, role: entry.role };
					})
					.sort((a, b) =>
						a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
					)
			);
		}
	} catch (error) {
		helper.handleError(req, res, error);
	}
});

/*
@route      /v1/org
@method     POST
@desc       Creates a new organization
@access     private
*/
router.post(
	"/",
	checkContentType,
	authSession,
	applyRules("create"),
	validate,
	async (req, res) => {
		// Start new database transaction session
		const session = await orgCtrl.startSession();
		try {
			const { name } = req.body;
			const { user } = req;
			// Check if the user can create an organization or not
			if (!req.user.canCreateOrg) {
				await orgCtrl.endSession(session);
				return res.status(401).json({
					error: "Unauthorized",
					details:
						"You do not have the authorization to create a new organization.",
					code: ERROR_CODES.unauthorized,
				});
			}

			// Create the new organization object
			let orgId = helper.generateId();
			let orgObj = await orgCtrl.create(
				{
					_id: orgId,
					ownerUserId: user._id,
					iid: helper.generateSlug("org"),
					name: name,
					color: helper.generateColor("light"),
					createdBy: user._id,
					isClusterEntity: false,
				},
				{ session, cacheKey: orgId }
			);

			// Add the creator of the organization as an 'Admin' member
			await orgMemberCtrl.create(
				{
					orgId: orgId,
					userId: req.user._id,
					role: "Admin",
				},
				{ session, cacheKey: `${orgId}.${user._id}` }
			);

			// Commit transaction
			await orgCtrl.commit(session);

			// Return the newly created organization object
			res.json(orgObj);

			// Log action
			auditCtrl.log(
				req.user,
				"org",
				"create",
				`Created a new organization named '${name}'`,
				orgObj,
				{ orgId }
			);
		} catch (error) {
			await orgCtrl.rollback(session);
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId
@method     PUT
@desc       Updates organization name
@access     private
*/
router.put(
	"/:orgId",
	checkContentType,
	authSession,
	validateOrg,
	authorizeOrgAction("org.update"),
	applyRules("update"),
	validate,
	async (req, res) => {
		try {
			const { name } = req.body;
			let orgObj = await orgCtrl.updateOneById(
				req.org._id,
				{ name: name, updatedBy: req.user._id },
				{},
				{ cacheKey: req.org._id }
			);

			res.json(orgObj);

			// Log action
			auditCtrl.logAndNotify(
				req.org._id,
				req.user,
				"org",
				"update",
				`Updated organization name from '${req.org.name}' to '${name}'`,
				orgObj,
				{ orgId: req.org._id }
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId
@method     DELETE
@desc       Deletes the organization
@access     private
*/
router.delete(
	"/:orgId",
	checkContentType,
	authSession,
	validateOrg,
	authorizeOrgAction("org.delete"),
	async (req, res) => {
		// Start new database transaction session
		const session = await orgCtrl.startSession();
		try {
			const { org, user } = req;

			if (
				org.ownerUserId.toString() !== req.user._id.toString() &&
				!req.user.isClusterOwner
			) {
				return res.status(401).json({
					error: "Not Authorized",
					details: `You are not authorized to delete organization '${org.name}'. Only the owner of the organization or cluster owner can delete it.`,
					code: ERROR_CODES.unauthorized,
				});
			}

			if (org.isClusterEntity) {
				return res.status(401).json({
					error: "Not Allowed",
					details: `You are not allowed to delete organization '${org.name}' which is the default organization of the cluster.`,
					code: ERROR_CODES.notAllowed,
				});
			}

			// Get all organization environments
			const environments = await prjEnvCtrl.getManyByQuery({
				orgId: org._id,
			});
			const environmentiids = environments.map((env) => env.iid);

			// Get all organization containers which have TCP proxy enabled
			const containers = await cntrCtrl.getManyByQuery({
				orgId: org._id,
				"networking.tcpProxy.enabled": true,
				"networking.tcpProxy.publicPort": { $exists: true },
			});
			const tcpProxyPorts = containers.map(
				(c) => c.networking.tcpProxy.publicPort
			);

			// Delete all organization related data
			await orgCtrl.deleteOrganization(session, org);
			// Delete namespaces
			await deleteNamespaces(environmentiids);
			// Remove exposed TCP proxy ports
			await deleteTCPProxyPorts(tcpProxyPorts);

			// Commit transaction
			await orgCtrl.commit(session);

			res.json();

			// Log action
			auditCtrl.logAndNotify(
				org._id,
				user,
				"org",
				"delete",
				`Deleted organization '${org.name}'`,
				org,
				{ orgId: org._id }
			);
		} catch (error) {
			await orgCtrl.rollback(session);
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId
@method     GET
@desc       Returns organization information of the user
@access     private
*/
router.get("/:orgId", authSession, validateOrg, async (req, res) => {
	try {
		res.json({ ...req.org, role: req.orgMember.role });
	} catch (error) {
		helper.handleError(req, res, error);
	}
});

/*
@route      /v1/org/:orgId/picture?width=128&height=128
@method     PUT
@desc       Updates the profile image of the organization. A picture with the name 'picture' needs to be uploaded in body of the request.
@access     private
*/
router.put(
	"/:orgId/picture",
	fileUploadMiddleware,
	authSession,
	validateOrg,
	authorizeOrgAction("org.update"),
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
			await storage.deleteFile(uploadBucket, req.org.pictureUrl);
			// Save the new file
			const filePath = `storage/avatars/${helper.generateSlug("img", 6)}-${
				req.file.originalname
			}`;

			const metaData = {
				"Content-Type": req.file.mimetype,
			};
			await storage.saveFile(uploadBucket, filePath, buffer, metaData);

			// Update organization with the new profile image url
			let orgObj = await orgCtrl.updateOneById(
				req.org._id,
				{
					pictureUrl: filePath,
					updatedBy: req.user._id,
				},
				{},
				{ cacheKey: req.org._id }
			);

			res.json(orgObj);

			// Log action
			auditCtrl.logAndNotify(
				req.org._id,
				req.user,
				"org",
				"update",
				"Updated organization picture",
				orgObj,
				{ orgId: req.org._id }
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId/picture
@method     DELETE
@desc       Removes the profile picture of the organization.
@access     private
*/
router.delete(
	"/:orgId/picture",
	authSession,
	validateOrg,
	authorizeOrgAction("org.update"),
	async (req, res) => {
		try {
			// Delete existing file if it exists
			const uploadBucket = config.get("general.storageBucket");
			storage.deleteFile(uploadBucket, req.org.pictureUrl);

			// Update user with the new profile image url
			let orgObj = await orgCtrl.updateOneById(
				req.org._id,
				{ updatedBy: req.user._id },
				{ pictureUrl: 1 },
				{ cacheKey: req.org._id }
			);

			res.json(orgObj);

			// Log action
			auditCtrl.logAndNotify(
				req.org._id,
				req.user,
				"org",
				"update",
				"Removed organization picture",
				orgObj,
				{ orgId: req.org._id }
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/org/:orgId/transfer/:userId
@method     POST
@desc       Transfers the ownership of the organization to an existing organization member.
@access     private
*/
router.post(
	"/:orgId/transfer/:userId",
	checkContentType,
	authSession,
	validateOrg,
	authorizeOrgAction("org.transfer"),
	applyRules("transfer"),
	validate,
	async (req, res) => {
		try {
			// Get transferred user information
			let transferredUser = await userCtrl.getOneById(req.params.userId, {
				cacheKey: req.params.userId,
			});

			// Transfer organization ownership
			let orgObj = await orgCtrl.updateOneById(
				req.org._id,
				{ ownerUserId: transferredUser._id, updatedBy: req.user._id },
				{},
				{ cacheKey: req.org._id }
			);

			res.json(orgObj);

			// Log action
			auditCtrl.logAndNotify(
				req.org._id,
				req.user,
				"org",
				"update",
				`Transferred organization ownership to user '${transferredUser.name}' (${transferredUser.email})`,
				orgObj,
				{ orgId: req.org._id }
			);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

export default router;
