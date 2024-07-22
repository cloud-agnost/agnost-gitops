import express from "express";
import auditCtrl from "../controllers/audit.js";
import cntrCtrl from "../controllers/container.js";
import gitCtrl from "../controllers/gitProvider.js";
import { authSession } from "../middlewares/authSession.js";
import { checkContentType } from "../middlewares/contentType.js";
import { validateOrg } from "../middlewares/validateOrg.js";
import { validateProject } from "../middlewares/validateProject.js";
import { validateEnvironment } from "../middlewares/validateEnvironment.js";
import { validateContainer } from "../middlewares/validateContainer.js";
import { authorizeProjectAction } from "../middlewares/authorizeProjectAction.js";
import {
	applyRules,
	checkTemplate,
	getValueChanges,
} from "../schemas/container.js";
import { validate } from "../middlewares/validate.js";
import { manageContainer } from "../handlers/k8s.js";
import { getNewTCPPortNumber } from "../handlers/cluster.js";
import {
	getContainerPods,
	getContainerEvents,
	getContainerLogs,
	getContainerTaskRuns,
	getTaskRunLogs,
} from "../handlers/status.js";
import {
	constructCreateRequestBodyForTemplate,
	constructUpdateRequestBodyForTemplate,
} from "../handlers/templates/middlewares.js";
import helper from "../util/helper.js";

import ERROR_CODES from "../config/errorCodes.js";

const router = express.Router({ mergeParams: true });

/*
@route      /v1/org/:orgId/project/:projectId/env/:envId/containers
@method     GET
@desc       Get all containers of a project environment
@access     private
*/
router.get(
	"/",
	authSession,
	validateOrg,
	validateProject,
	validateEnvironment,
	authorizeProjectAction("project.container.view"),
	async (req, res) => {
		try {
			const { environment } = req;
			const { search, sortBy, sortDir } = req.query;

			let query = { environmentId: environment._id };
			if (search) {
				query.name = {
					$regex: helper.escapeStringRegexp(search),
					$options: "i",
				};
			}

			let sort = {};
			if (sortBy && sortDir) {
				sort[sortBy] = sortDir;
			} else sort = { createdAt: "desc" };

			let containers = await cntrCtrl.getManyByQuery(query, {
				sort,
			});

			res.json(containers);
		} catch (err) {
			helper.handleError(req, res, err);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/env/:envId/containers
@method     POST
@desc       Creates a new container in project environment
@access     private
*/
router.post(
	"/",
	checkContentType,
	authSession,
	validateOrg,
	validateProject,
	validateEnvironment,
	authorizeProjectAction("project.container.create"),
	checkTemplate,
	validate,
	constructCreateRequestBodyForTemplate,
	applyRules("create"),
	validate,
	async (req, res) => {
		let container = null;
		// We do not create a session here because the engine-worker send back the webhookid for the build pipeline if a repo is connected
		const containerId = helper.generateId();
		const { org, project, environment, gitProvider, registry, body, user } =
			req;

		try {
			if (environment.isClusterEntity) {
				return res.status(401).json({
					error: "Not Allowed",
					details: `You are not allowed to create a new container within environment '${environment.name}' which is the default environment of the cluster.`,
					code: ERROR_CODES.notAllowed,
				});
			}

			// Remove the data that cannot be updated
			delete body.status;
			delete body.pipelineStatus;
			delete body.updatedBy;

			// Set initial pipeline status
			if (body.repoOrRegistry === "repo")
				body.pipelineStatus = body.repo.connected
					? "Connected"
					: "Not Connected";
			else body.pipelineStatus = "N/A";

			if (body.type !== "cronjob") {
				// If there already a port number assignment then use it otherwise generate a new one
				body.networking.tcpProxy.publicPort = await getNewTCPPortNumber();
			}

			container = await cntrCtrl.create(
				{
					...body,
					_id: containerId,
					orgId: org._id,
					projectId: project._id,
					environmentId: environment._id,
					iid: body.name,
					slug: helper.generateSlug(null, 8),
					createdBy: user._id,
				},
				{ cacheKey: containerId }
			);

			// Clear unnecessary config values since mongoose assigns default values for them
			const unset = {};
			if (body.type === "statefulset") {
				unset.deploymentConfig = ""; // delete deploymentConfig
				unset.cronJobConfig = ""; // delete cronJobConfig
			} else if (body.type === "deployment") {
				unset.statefulSetConfig = ""; // delete statefulSetConfig
				unset.cronJobConfig = ""; // delete cronJobConfig
			} else if ("type" === "cronjob") {
				unset.statefulSetConfig = ""; // delete statefulSetConfig
				unset.deploymentConfig = ""; // delete deploymentConfig
				unset.networking = ""; // delete networking
				unset.probes = ""; // delete probes
			}

			if (body.repoOrRegistry === "repo") {
				unset.registry = ""; // delete registry
			} else {
				unset.repo = ""; // delete repo
			}

			container = await cntrCtrl.updateOneById(container._id, {}, unset, {
				cacheKey: containerId,
			});

			// Create the container in the Kubernetes cluster, before creating the container assign the secrets if there are any
			container.secrets = req.secrets;
			await manageContainer({
				container,
				environment,
				gitProvider,
				registry,
				action: "create",
			});

			res.json(container);

			// Log action
			auditCtrl.logAndNotify(
				environment._id,
				user,
				"org.project.environment.container",
				"create",
				`Created new '${body.type}' named '${body.name}'`,
				container,
				{
					orgId: org._id,
					projectId: project._id,
					environmentId: environment._id,
					containerId: container._id,
				}
			);
		} catch (err) {
			// Clean up
			await cntrCtrl.deleteOneById(containerId, { cacheKey: containerId });
			await manageContainer({
				container,
				environment,
				gitProvider,
				registry,
				action: "delete",
			});

			helper.handleError(req, res, err);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/env/:envId/containers/:containerId
@method     GET
@desc       Returns data about a specific container
@access     private
*/
router.get(
	"/:containerId",
	authSession,
	validateOrg,
	validateProject,
	validateEnvironment,
	validateContainer,
	authorizeProjectAction("project.container.view"),
	async (req, res) => {
		try {
			const { container } = req;

			res.json(container);
		} catch (err) {
			helper.handleError(req, res, err);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/env/:envId/containers/:containerId
@method     PUT
@desc       Updates the container properties
@access     private
*/
router.put(
	"/:containerId",
	checkContentType,
	authSession,
	validateOrg,
	validateProject,
	validateEnvironment,
	validateContainer,
	constructUpdateRequestBodyForTemplate,
	authorizeProjectAction("project.container.update"),
	applyRules("update"),
	validate,
	async (req, res) => {
		const session = await cntrCtrl.startSession();
		try {
			const {
				org,
				project,
				environment,
				container,
				gitProvider,
				registry,
				body,
				user,
			} = req;

			// We need to set this value to the existing value because it cannot be updated if source is repo
			if (container.repoOrRegistry === "repo")
				body.repo.webHookId = container.repo.webHookId;

			// We do not support update for following values yet, make sure they are not updated
			if (container.cronJobConfig && body.cronJobConfig) {
				body.cronJobConfig.successfulJobsHistoryLimit =
					container.cronJobConfig.successfulJobsHistoryLimit;
				body.cronJobConfig.failedJobsHistoryLimit =
					container.cronJobConfig.failedJobsHistoryLimit;
			}
			// We do not support update for following values yet, make sure they are not updated
			if (container.statefulSetConfig && body.statefulSetConfig) {
				body.statefulSetConfig.strategy = container.statefulSetConfig.strategy;
				body.statefulSetConfig.rollingUpdate =
					container.statefulSetConfig.rollingUpdate;
				body.statefulSetConfig.revisionHistoryLimit =
					container.statefulSetConfig.revisionHistoryLimit;
				body.statefulSetConfig.podManagementPolicy =
					container.statefulSetConfig.podManagementPolicy;
			}

			// We do not support update for following values yet, make sure they are not updated
			if (container.deploymentConfig && body.deploymentConfig) {
				body.deploymentConfig.strategy = container.deploymentConfig.strategy;
				body.deploymentConfig.rollingUpdate =
					container.deploymentConfig.rollingUpdate;
				body.deploymentConfig.revisionHistoryLimit =
					container.deploymentConfig.revisionHistoryLimit;
			}

			if (container.type !== "cronjob") {
				// If there already a port number assignment then use it otherwise generate a new one
				body.networking.tcpProxy.publicPort =
					container.networking.tcpProxy.publicPort ??
					(await getNewTCPPortNumber());
			}

			// Once a stateful set is created, some storage properties cannot be changed
			if (container.type === "statefulset") {
				body.storageConfig.enabled = container.storageConfig.enabled;
				body.storageConfig.accessModes = container.storageConfig.accessModes;
			} else {
				// Once accesss mode for storage is set, it cannot be changed
				if (
					container.storageConfig.enabled === true &&
					body.storageConfig.enabled === true
				) {
					body.storageConfig.accessModes = container.storageConfig.accessModes;
				}
			}

			if (container.repoOrRegistry === "repo" && !body.repo.connected)
				body.pipelineStatus = "Not Connected";

			// Remove the unnecessary data
			const unset = {};
			if (body.repoOrRegistry === "repo") {
				unset.registry = ""; // delete registry
			} else {
				unset.repo = ""; // delete repo
			}

			const updatedContainer = await cntrCtrl.updateOneById(
				container._id,
				{
					...body,
					updatedBy: user._id,
				},
				unset,
				{
					cacheKey: container._id,
					session,
				}
			);

			// Updates the container in the Kubernetes cluster
			await manageContainer({
				container: updatedContainer,
				environment,
				gitProvider,
				registry,
				changes: getValueChanges(container, updatedContainer), // Get the list of the fields that have changed
				action: "update",
				session: session,
			});

			// Commit the database transaction
			await cntrCtrl.commit(session);

			res.json(updatedContainer);

			// Log action
			auditCtrl.logAndNotify(
				environment._id,
				user,
				"org.project.environment.container",
				"update",
				`Updated '${container.type}' named '${body.name}'`,
				updatedContainer,
				{
					orgId: org._id,
					projectId: project._id,
					environmentId: environment._id,
					containerId: container._id,
				}
			);
		} catch (err) {
			await cntrCtrl.rollback(session);
			helper.handleError(req, res, err);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/env/:envId/containers/:containerId
@method     PIT
@desc       Deletes the container
@access     private
*/
router.delete(
	"/:containerId",
	checkContentType,
	authSession,
	validateOrg,
	validateProject,
	validateEnvironment,
	validateContainer,
	authorizeProjectAction("project.container.delete"),
	async (req, res) => {
		const session = await cntrCtrl.startSession();

		try {
			const { org, project, environment, container, body, user } = req;

			if (container.isClusterEntity) {
				return res.status(401).json({
					error: "Not Allowed",
					details: `You are not allowed to delete container '${container.name}' which is one of the default containers of the cluster.`,
					code: ERROR_CODES.notAllowed,
				});
			}

			await cntrCtrl.deleteOneById(container._id, {
				session,
				cacheKey: container._id,
			});

			let gitProvider = null;
			if (container.repoOrRegistry === "repo" && container.repo.gitProviderId) {
				gitProvider = await gitCtrl.getOneById(container.repo.gitProviderId);

				if (gitProvider?.accessToken)
					gitProvider.accessToken = helper.decryptText(gitProvider.accessToken);
				if (gitProvider?.refreshToken)
					gitProvider.refreshToken = helper.decryptText(
						gitProvider.refreshToken
					);
			}

			// Deletes the container in the Kubernetes cluster
			await manageContainer({
				container,
				environment,
				gitProvider,
				action: "delete",
			});

			// Commit the database transaction
			await cntrCtrl.commit(session);

			res.json();

			// Log action
			auditCtrl.logAndNotify(
				environment._id,
				user,
				"org.project.environment.container",
				"delete",
				`Deleted '${body.type}' named '${body.name}'`,
				{},
				{
					orgId: org._id,
					projectId: project._id,
					environmentId: environment._id,
					containerId: container._id,
				}
			);
		} catch (err) {
			await cntrCtrl.rollback(session);
			helper.handleError(req, res, err);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/env/:envId/containers/:containerId/pods
@method     GET
@desc       Returns container pods
@access     private
*/
router.get(
	"/:containerId/pods",
	authSession,
	validateOrg,
	validateProject,
	validateEnvironment,
	validateContainer,
	authorizeProjectAction("project.container.view"),
	async (req, res) => {
		try {
			const { container, environment } = req;
			const pods = await getContainerPods({ container, environment });
			res.json(pods);
		} catch (err) {
			helper.handleError(req, res, err);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/env/:envId/containers/:containerId/events
@method     GET
@desc       Returns container events
@access     private
*/
router.get(
	"/:containerId/events",
	authSession,

	validateOrg,
	validateProject,
	validateEnvironment,
	validateContainer,
	authorizeProjectAction("project.container.view"),
	async (req, res) => {
		try {
			const { container, environment } = req;
			const events = await getContainerEvents({ container, environment });
			res.json(events);
		} catch (err) {
			helper.handleError(req, res, err);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/env/:envId/containers/:containerId/logs
@method     GET
@desc       Returns container logs
@access     private
*/
router.get(
	"/:containerId/logs",
	authSession,
	validateOrg,
	validateProject,
	validateEnvironment,
	validateContainer,
	authorizeProjectAction("project.container.view"),
	async (req, res) => {
		try {
			const { container, environment } = req;
			const logs = await getContainerLogs({ container, environment });
			res.json(logs);
		} catch (err) {
			helper.handleError(req, res, err);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/env/:envId/containers/:containerId/pipelines
@method     GET
@desc       Returns container build & deploy pipeline runs
@access     private
*/
router.get(
	"/:containerId/pipelines",
	authSession,
	validateOrg,
	validateProject,
	validateEnvironment,
	validateContainer,
	authorizeProjectAction("project.container.view"),
	async (req, res) => {
		try {
			const { container, environment } = req;
			const pipelines = await getContainerTaskRuns({ container, environment });
			res.json(pipelines);
		} catch (err) {
			helper.handleError(req, res, err);
		}
	}
);

/*
@route      /v1/org/:orgId/project/:projectId/env/:envId/containers/:containerId/pipelines/:pipelineName
@method     GET
@desc       Returns logs of specific build & deploy pipeline run of a container
@access     private
*/
router.get(
	"/:containerId/pipelines/:pipelineName",
	authSession,
	validateOrg,
	validateProject,
	validateEnvironment,
	validateContainer,
	authorizeProjectAction("project.container.view"),
	async (req, res) => {
		try {
			const { pipelineName } = req.params;
			const { container, environment } = req;
			const logs = await getTaskRunLogs({
				container,
				environment,
				taskRunName: pipelineName,
			});
			res.json(logs);
		} catch (err) {
			helper.handleError(req, res, err);
		}
	}
);

export default router;
