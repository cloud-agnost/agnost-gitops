import axios from "axios";
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
import { applyRules } from "../schemas/container.js";
import { validate } from "../middlewares/validate.js";

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
	applyRules("create"),
	validate,
	async (req, res) => {
		// We do not create a session here because the engine-worker send back the webhookid for the build pipeline
		const containerId = helper.generateId();
		try {
			const { org, project, environment, gitProvider, body, user } = req;

			if (environment.isClusterEntity) {
				return res.status(401).json({
					error: t("Not Allowed"),
					details: t(
						"You are not allowed to create a new container within environment '%s' which is the default environment of the cluster.",
						environment.name
					),
					code: ERROR_CODES.notAllowed,
				});
			}

			// Remove the data that cannot be updated
			delete body.status;
			delete body.pipelineStatus;
			delete body.updatedBy;

			let prefix = "cnt";
			switch (body.type) {
				case "deployment":
					prefix = "dpl";
					break;
				case "stateful set":
					prefix = "sts";
					break;
				case "cron job":
					prefix = "crj";
					break;
				case "knative service":
					prefix = "kns";
					break;
				default:
					break;
			}

			const container = await cntrCtrl.create(
				{
					...body,
					_id: containerId,
					orgId: org._id,
					projectId: project._id,
					environmentId: environment._id,
					iid: helper.generateSlug(prefix),
					createdBy: user._id,
				},
				{ cacheKey: containerId }
			);

			// Create the container in the Kubernetes cluster
			await axios.post(
				helper.getWorkerUrl() + "/v1/cicd/container",
				{ container, environment, gitProvider, action: "create" },
				{
					headers: {
						Authorization: process.env.ACCESS_TOKEN,
						"Content-Type": "application/json",
					},
				}
			);

			res.json(container);

			// Log action
			auditCtrl.logAndNotify(
				environment._id,
				user,
				"org.project.environment.container",
				"create",
				t("Created new '%s' named '%s'", body.type, body.name),
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
	authorizeProjectAction("project.container.update"),
	applyRules("update"),
	validate,
	async (req, res) => {
		try {
			const { org, project, environment, container, gitProvider, body, user } =
				req;

			// Remove the data that cannot be updated
			delete body._id;
			delete body.iid;
			delete body.orgId;
			delete body.projectId;
			delete body.environmentId;
			delete body.type;
			delete body.repoOrRegistry;
			delete body.status;
			delete body.pipelineStatus;
			delete body.createdBy;
			delete body.createdAt;
			delete body.updatedAt;
			delete body.updatedBy;

			// We need to set this value to the existing value because it cannot be updated
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

			if (container.deploymentConfig && body.deploymentConfig) {
				body.deploymentConfig.strategy = container.deploymentConfig.strategy;
				body.deploymentConfig.rollingUpdate =
					container.deploymentConfig.rollingUpdate;
				body.deploymentConfig.revisionHistoryLimit =
					container.deploymentConfig.revisionHistoryLimit;
			}

			if (container.knativeConfig && body.knativeConfig) {
				body.knativeConfig.revisionHistoryLimit =
					container.knativeConfig.revisionHistoryLimit;
			}

			if (
				container.type !== "cron job" &&
				container.type !== "knative service"
			) {
				// If there already a port number assignment then use it otherwise generate a new one
				body.networking.tcpProxy.publicPort =
					container.networking.tcpProxy.publicPort ??
					(await helper.getNewTCPPortNumber());
			}

			// Once a stateful set is created, some storage properties cannot be changed
			if (container.type === "stateful set") {
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

			if (!body.repo.connected) body.pipelineStatus = "Disconnected";

			const updatedContainer = await cntrCtrl.updateOneById(
				container._id,
				{
					...body,
					updatedBy: user._id,
				},
				{},
				{
					cacheKey: container._id,
				}
			);

			console.log("***here", updatedContainer.repo);

			// Deletes the container in the Kubernetes cluster
			await axios.post(
				helper.getWorkerUrl() + "/v1/cicd/container",
				{
					container: updatedContainer,
					environment,
					gitProvider,
					changes: {
						containerPort:
							container.networking.containerPort !==
							updatedContainer.networking.containerPort,
						customDomain:
							container.networking.customDomain.domain !==
							updatedContainer.networking.customDomain.domain,
						gitRepo:
							container.repo.type !== updatedContainer.repo.type ||
							container.repo.connected !== updatedContainer.repo.connected ||
							container.repo.name !== updatedContainer.repo.name ||
							container.repo.url !== updatedContainer.repo.url ||
							container.repo.branch !== updatedContainer.repo.branch ||
							container.repo.path !== updatedContainer.repo.path ||
							container.repo.dockerfile !== updatedContainer.repo.dockerfile ||
							container.repo.gitProviderId?.toString() !==
								updatedContainer.repo.gitProviderId?.toString(),
					},
					action: "update",
				},
				{
					headers: {
						Authorization: process.env.ACCESS_TOKEN,
						"Content-Type": "application/json",
					},
				}
			);

			res.json(updatedContainer);

			// Log action
			auditCtrl.logAndNotify(
				environment._id,
				user,
				"org.project.environment.container",
				"update",
				t("Updated '%s' named '%s'", body.type, body.name),
				updatedContainer,
				{
					orgId: org._id,
					projectId: project._id,
					environmentId: environment._id,
					containerId: container._id,
				}
			);
		} catch (err) {
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
					error: t("Not Allowed"),
					details: t(
						"You are not allowed to delete container '%s' which is one of the default containers of the cluster.",
						container.name
					),
					code: ERROR_CODES.notAllowed,
				});
			}

			await cntrCtrl.deleteOneById(container._id, {
				session,
				cacheKey: container._id,
			});

			let gitProvider = null;
			if (container.repo.gitProviderId) {
				gitProvider = await gitCtrl.getOneById(container.repo.gitProviderId);

				if (gitProvider?.accessToken)
					gitProvider.accessToken = helper.decryptText(gitProvider.accessToken);
				if (gitProvider?.refreshToken)
					gitProvider.refreshToken = helper.decryptText(
						gitProvider.refreshToken
					);
			}
			// Deletes the container in the Kubernetes cluster
			await axios.post(
				helper.getWorkerUrl() + "/v1/cicd/container",
				{ container, environment, gitProvider, action: "delete" },
				{
					headers: {
						Authorization: process.env.ACCESS_TOKEN,
						"Content-Type": "application/json",
					},
				}
			);

			// Commit the database transaction
			await cntrCtrl.commit(session);

			res.json();

			// Log action
			auditCtrl.logAndNotify(
				environment._id,
				user,
				"org.project.environment.container",
				"delete",
				t("Deleted '%s' named '%s'", body.type, body.name),
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
			const result = await axios.post(
				helper.getWorkerUrl() + "/v1/cicd/container/pods",
				{ container, environment },
				{
					headers: {
						Authorization: process.env.ACCESS_TOKEN,
						"Content-Type": "application/json",
					},
				}
			);

			res.json(result.data.payload);
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
			const result = await axios.post(
				helper.getWorkerUrl() + "/v1/cicd/container/events",
				{ container, environment },
				{
					headers: {
						Authorization: process.env.ACCESS_TOKEN,
						"Content-Type": "application/json",
					},
				}
			);

			res.json(result.data.payload);
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
			const result = await axios.post(
				helper.getWorkerUrl() + "/v1/cicd/container/logs",
				{ container, environment },
				{
					headers: {
						Authorization: process.env.ACCESS_TOKEN,
						"Content-Type": "application/json",
					},
				}
			);

			res.json(result.data.payload);
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
			const result = await axios.post(
				helper.getWorkerUrl() + "/v1/cicd/container/pipelines",
				{ container, environment },
				{
					headers: {
						Authorization: process.env.ACCESS_TOKEN,
						"Content-Type": "application/json",
					},
				}
			);

			res.json(result.data.payload);
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
			const result = await axios.post(
				helper.getWorkerUrl() + "/v1/cicd/container/taskrun-logs",
				{ container, environment, taskRunName: pipelineName },
				{
					headers: {
						Authorization: process.env.ACCESS_TOKEN,
						"Content-Type": "application/json",
					},
				}
			);

			res.json(result.data.payload);
		} catch (err) {
			helper.handleError(req, res, err);
		}
	}
);

export default router;
