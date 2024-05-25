import express from "express";
import cntrCtrl from "../controllers/container.js";
import { authMasterToken } from "../middlewares/authMasterToken.js";
import { checkContentType } from "../middlewares/contentType.js";

import { sendMessage } from "../init/sync.js";

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
				description: t("Container status updated to '%s'", status.status),
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
@route      /v1/cluster/status
@method     POST
@desc       Updates the status of cluster's default deployments
@access     public
*/
router.post(
	"/cluster/status",
	checkContentType,
	authMasterToken,
	async (req, res) => {
		try {
			// Update cluster configuration
			await clsCtrl.updateOneByQuery(
				{
					clusterAccesssToken: process.env.CLUSTER_ACCESS_TOKEN,
				},
				{ clusterResourceStatus: req.body }
			);

			res.json();

			// Send realtime notification message that cluster deployment status has changed
			sendMessage("cluster", {
				action: "update",
				object: "cluster",
				description: t("Status of cluster defaul deployments has changed"),
				timestamp: Date.now(),
				data: req.body,
			});
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/telemetry/webhook/set
@method     POST
@desc       Updates the webhook id of the container repo
@access     public
*/
router.post(
	"/webhook/set",
	checkContentType,
	authMasterToken,
	async (req, res) => {
		try {
			const { container, webHookId } = req.body;
			await cntrCtrl.updateOneById(
				container._id,
				{
					"repo.webHookId": webHookId,
				},
				{},
				{ cacheKey: container._id }
			);

			res.json();
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/telemetry/webhook/remove
@method     POST
@desc       Removes the webhook id of the container repo
@access     public
*/
router.post(
	"/webhook/remove",
	checkContentType,
	authMasterToken,
	async (req, res) => {
		try {
			const { container } = req.body;
			await cntrCtrl.updateOneById(
				container._id,
				{},
				{ "repo.webHookId": "" },
				{ cacheKey: container._id }
			);

			res.json();
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
			const { containeriid, status } = req.body;
			const container = await cntrCtrl.getOneByQuery({ iid: containeriid });
			if (!container) return res.json();

			let updatedContainer = await cntrCtrl.updateOneById(
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
				description: t(
					"Container build pipeline status updated to '%s'",
					status
				),
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
