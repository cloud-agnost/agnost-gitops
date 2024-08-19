import express from "express";
import cntrCtrl from "../controllers/container.js";
import { authMasterToken } from "../middlewares/authMasterToken.js";
import { checkContentType } from "../middlewares/contentType.js";
import { sendMessage } from "../init/sync.js";
import helper from "../util/helper.js";
import { deleteKey } from "../init/cache.js";

const router = express.Router({ mergeParams: true });

/*
@route      /v1/telemetry/container/status
@method     POST
@desc       Updates the status of the container
@access     public
*/
router.post(
	"/container/status",
	checkContentType,
	authMasterToken,
	async (req, res) => {
		try {
			const { container, status } = req.body;
			let updatedContainer = await cntrCtrl.updateOneById(
				container._id,
				{
					status: status,
				},
				{},
				{ cacheKey: container._id }
			);

			res.json();

			// Send realtime message about the status change of the container
			sendMessage(container._id, {
				actor: null,
				action: "telemetry",
				object: "org.project.environment.container",
				description: `Container status updated to '${status.status}'`,
				timestamp: Date.now(),
				data: updatedContainer,
				identifiers: {
					orgId: updatedContainer.orgId,
					projectId: updatedContainer.projectId,
					environmentId: updatedContainer.environmentId,
					containerId: updatedContainer._id,
				},
			});
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/telemetry/container/images
@method     POST
@desc       Updates the latest images of the container
@access     public
*/
router.post(
	"/container/images",
	checkContentType,
	authMasterToken,
	async (req, res) => {
		try {
			const { slug, images } = req.body;
			let updatedContainer = await cntrCtrl.updateOneByQuery(
				{ slug },
				{
					latestImages: images,
				}
			);

			// Renew the container cache
			deleteKey(updatedContainer._id);

			res.json();

			// Send realtime message about the status change of the container
			sendMessage(updatedContainer._id, {
				actor: null,
				action: "telemetry",
				object: "org.project.environment.container",
				description: `Container latest images updated`,
				timestamp: Date.now(),
				data: updatedContainer,
				identifiers: {
					orgId: updatedContainer.orgId,
					projectId: updatedContainer.projectId,
					environmentId: updatedContainer.environmentId,
					containerId: updatedContainer._id,
				},
			});
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/telemetry/pipeline/status
@method     POST
@desc       Sets the pipeline status of the container
@access     public
*/
router.post(
	"/pipeline/status",
	checkContentType,
	authMasterToken,
	async (req, res) => {
		try {
			const { containerSlug, status } = req.body;
			const container = await cntrCtrl.getOneByQuery({ slug: containerSlug });
			if (!container) return res.json();

			let updatedContainer = await cntrCtrl.updateOneByQuery(
				container._id,
				{
					pipelineStatus: status,
				},
				{},
				{ cacheKey: container._id }
			);

			res.json();

			// Send realtime message about the status change of the container
			sendMessage(container._id, {
				actor: null,
				action: "telemetry",
				object: "org.project.environment.container",
				description: `Container build pipeline status updated to '${status}'`,
				timestamp: Date.now(),
				data: updatedContainer,
				identifiers: {
					orgId: updatedContainer.orgId,
					projectId: updatedContainer.projectId,
					environmentId: updatedContainer.environmentId,
					containerId: updatedContainer._id,
				},
			});
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

export default router;
