import axios from "axios";
import express from "express";
import userCtrl from "../controllers/user.js";
import clsCtrl from "../controllers/cluster.js";
import cntrCtrl from "../controllers/container.js";
import domainCtrl from "../controllers/domain.js";
import { authSession } from "../middlewares/authSession.js";
import { applyRules } from "../schemas/cluster.js";
import { validate } from "../middlewares/validate.js";
import { validateCluster } from "../middlewares/validateCluster.js";
import { validateClusterIPs } from "../middlewares/validateClusterIPs.js";
import { checkContentType } from "../middlewares/contentType.js";
import {
	addClusterCustomDomain,
	deleteClusterCustomDomains,
	updateEnforceSSLAccessSettings,
} from "../handlers/ingress.js";

import ERROR_CODES from "../config/errorCodes.js";

const router = express.Router({ mergeParams: true });

/*
@route      /v1/cluster/setup-status
@method     GET
@desc       Returns true if cluster set-up is complete otherwiser returns false
@access     public
*/
router.get("/setup-status", async (req, res) => {
	try {
		// Get cluster owner
		let user = await userCtrl.getOneByQuery({ isClusterOwner: true });
		res.status(200).json({ status: user ? true : false });
	} catch (error) {
		handleError(req, res, error);
	}
});

/*
@route      /v1/cluster/info
@method     GET
@desc       Returns information about the cluster itself
@access     public
*/
router.get("/info", authSession, async (req, res) => {
	try {
		const { user } = req;
		if (!user.isClusterOwner) {
			return res.status(401).json({
				error: t("Not Authorized"),
				details: t(
					"You are not authorized to view cluster information. Only the cluster owner can view and manage cluster info."
				),
				code: ERROR_CODES.unauthorized,
			});
		}

		// Get cluster configuration
		let cluster = await clsCtrl.getOneByQuery({
			clusterAccesssToken: process.env.CLUSTER_ACCESS_TOKEN,
		});

		res.json(cluster);
	} catch (error) {
		helper.handleError(req, res, error);
	}
});

/*
@route      /v1/cluster/status
@method     GET
@desc       Returns status information about the cluster internal resources
@access     public
*/
router.get("/status", authSession, async (req, res) => {
	try {
		// Get cluster configuration
		let cluster = await clsCtrl.getOneByQuery({
			clusterAccesssToken: process.env.CLUSTER_ACCESS_TOKEN,
		});

		res.json(cluster.clusterResourceStatus);
	} catch (error) {
		helper.handleError(req, res, error);
	}
});

/*
@route      /v1/cluster/release-info
@method     GET
@desc       Returns information about the current release of the cluster and the latest Agnost release
@access     public
*/
router.get("/release-info", authSession, async (req, res) => {
	try {
		// Get cluster configuration
		const cluster = await clsCtrl.getOneByQuery({
			clusterAccesssToken: process.env.CLUSTER_ACCESS_TOKEN,
		});

		if (!cluster.release) {
			return res.status(404).json({
				error: t("Not Found"),
				details: t("Release information not found."),
				code: ERROR_CODES.notFound,
			});
		}

		const latest = await axios.get(
			"https://raw.githubusercontent.com/cloud-agnost/agnost-gitops/master/releases/latest.json",
			{
				headers: {
					Accept: "application/vnd.github.v3+json",
				},
			}
		);

		const current = await axios.get(
			`https://raw.githubusercontent.com/cloud-agnost/agnost-gitops/master/releases/${cluster.release}.json`,
			{
				headers: {
					Accept: "application/vnd.github.v3+json",
				},
			}
		);

		res.json({
			current: current.data,
			latest: latest.data,
			cluster: cluster,
		});
	} catch (error) {
		helper.handleError(req, res, error);
	}
});

/*
@route      /v1/cluster/components
@method     GET
@desc       Returns information about the cluster components, platform, studio, sync, mongodb, redis, minio etc.
@access     public
*/
router.get("/components", authSession, async (req, res) => {
	try {
		const { user } = req;
		if (!user.isClusterOwner) {
			return res.status(401).json({
				error: t("Not Authorized"),
				details: t(
					"You are not authorized to view cluster components. Only the cluster owner can manage cluster core components."
				),
				code: ERROR_CODES.unauthorized,
			});
		}

		let manager = new ClusterManager();
		const clusterInfo = await manager.getClusterInfo();

		res.json(clusterInfo);
	} catch (error) {
		helper.handleError(req, res, error);
	}
});

/*
@route      /v1/cluster/update-release
@method     PUT
@desc       Updates the version of cluster's default deployments to the versions' specified in the release
@access     public
*/
router.put(
	"/update-release",
	checkContentType,
	authSession,
	applyRules("update-version"),
	validate,
	async (req, res) => {
		try {
			const { user } = req;
			if (!user.isClusterOwner) {
				return res.status(401).json({
					error: t("Not Authorized"),
					details: t(
						"You are not authorized to update cluster release number. Only the cluster owner can manage cluster core components."
					),
					code: ERROR_CODES.unauthorized,
				});
			}

			// Get cluster configuration
			const cluster = await clsCtrl.getOneByQuery({
				clusterAccesssToken: process.env.CLUSTER_ACCESS_TOKEN,
			});

			const { release } = req.body;

			// If existing and new release are the same do nothing
			if (cluster.release === release) return res.json(cluster);

			let oldReleaseInfo = null;
			let newReleaseInfo = null;

			try {
				oldReleaseInfo = await axios.get(
					`https://raw.githubusercontent.com/cloud-agnost/agnost-gitops/master/releases/${cluster.release}.json`,
					{
						headers: {
							Accept: "application/vnd.github.v3+json",
						},
					}
				);
			} catch (err) {
				return res.status(404).json({
					error: t("Not Found"),
					details: t("There is no such Agnost release '%s'.", cluster.release),
					code: ERROR_CODES.notFound,
				});
			}

			try {
				newReleaseInfo = await axios.get(
					`https://raw.githubusercontent.com/cloud-agnost/agnost-gitops/master/releases/${release}.json`,
					{
						headers: {
							Accept: "application/vnd.github.v3+json",
						},
					}
				);
			} catch (err) {
				return res.status(404).json({
					error: t("Not Found"),
					details: t("There is no such Agnost release '%s'.", release),
					code: ERROR_CODES.notFound,
				});
			}

			// Indetify the deployments whose release number has changed
			const requiredUpdates = [];
			for (const [key, value] of Object.entries(oldReleaseInfo.data.modules)) {
				if (value !== newReleaseInfo.data.modules[key]) {
					const entry = {
						deploymentName: `${key}`,
						tag: newReleaseInfo.data.modules[key],
						image: `gcr.io/agnost-gitops/${key}:${newReleaseInfo.data.modules[key]}`,
					};

					requiredUpdates.push(entry);
				}
			}

			// If no updates do nothing
			if (requiredUpdates.length === 0) return res.json(cluster);

			let manager = new ClusterManager();
			for (const update of requiredUpdates) {
				await manager.updateDeployment(
					update.deploymentName,
					null,
					update.image
				);
			}

			// Update cluster release information
			let updatedCluster = await clsCtrl.updateOneByQuery(
				{
					clusterAccesssToken: process.env.CLUSTER_ACCESS_TOKEN,
				},
				{
					release: release,
					releaseHistory: [...cluster.releaseHistory, { release: release }],
				}
			);

			res.json(updatedCluster);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/cluster/domain-status
@method     GET
@desc       Returns information whether custom domains can be added to the cluster or not
@access     public
*/
router.get(
	"/domain-status",
	authSession,
	validateCluster,
	validateClusterIPs,
	async (req, res) => {
		try {
			res.json();
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/cluster/domains
@method     POST
@desc       Adds a custom domain to the cluster
@access     public
*/
router.post(
	"/domains",
	checkContentType,
	authSession,
	validateCluster,
	validateClusterIPs,
	applyRules("add-domain"),
	validate,
	async (req, res) => {
		try {
			const { user, cluster } = req;
			if (!user.isClusterOwner) {
				return res.status(401).json({
					error: t("Not Authorized"),
					details: t(
						"You are not authorized to add custom domain to the cluster. Only the cluster owner can manage cluster custom domains."
					),
					code: ERROR_CODES.unauthorized,
				});
			}

			const domains = cluster.domains ?? [];
			const { domain } = req.body;

			if (domains.length >= config.get("general.maxClusterCustomDomains")) {
				return res.status(401).json({
					error: t("Not Allowed"),
					details: t(
						"You can add maximum '%s' custom domains to a cluster.",
						config.get("general.maxClusterCustomDomains")
					),
					code: ERROR_CODES.notAllowed,
				});
			}

			// Get all container ingresses that will be impacted
			let containers = await cntrCtrl.getManyByQuery(
				{
					"networking.ingress.enabled": true,
				},
				{ lookup: "environmentId" }
			);

			containers = containers.map((entry) => {
				return {
					containeriid: entry.iid,
					namespace: entry.environmentId.iid,
					containerPort: entry.networking.containerPort,
				};
			});

			if (containers?.length > 0) {
				for (const entry of containers) {
					await addClusterCustomDomain(
						entry.containeriid,
						entry.namespace,
						domain,
						entry.containerPort,
						cluster.enforceSSLAccess
					);
				}
			}

			// Update cluster domains information
			let updatedCluster = await clsCtrl.updateOneById(cluster._id, {
				domains: [...domains, domain],
			});

			// Add the domain to the domain list
			await domainCtrl.create({ domain });

			res.json(updatedCluster);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/cluster/domains
@method     DELETE
@desc       Removes a custom domain from the cluster
@access     public
*/
router.delete(
	"/domains",
	checkContentType,
	authSession,
	validateCluster,
	validateClusterIPs,
	applyRules("delete-domain"),
	validate,
	async (req, res) => {
		try {
			const { user, cluster } = req;
			if (!user.isClusterOwner) {
				return res.status(401).json({
					error: t("Not Authorized"),
					details: t(
						"You are not authorized to manage custom domains of the cluster. Only the cluster owner can manage cluster custom domains."
					),
					code: ERROR_CODES.unauthorized,
				});
			}

			const domains = cluster.domains ?? [];
			const { domain } = req.body;

			// Get all container ingresses that will be impacted
			let containers = await cntrCtrl.getManyByQuery(
				{
					"networking.ingress.enabled": true,
				},
				{ lookup: "environmentId" }
			);

			containers = containers.map((entry) => {
				return { containeriid: entry.iid, namespace: entry.environmentId.iid };
			});

			if (containers.length > 0) {
				for (const entry of containers) {
					await deleteClusterCustomDomains(
						entry.containeriid,
						entry.namespace,
						[domain]
					);
				}
			}

			// Update cluster domains information
			const updatedList = domains.filter((entry) => entry !== domain);

			// Update cluster domains information
			let updatedCluster = await clsCtrl.updateOneByQuery(
				{
					clusterAccesssToken: process.env.CLUSTER_ACCESS_TOKEN,
				},
				{
					domains: updatedList,
					// If there are no domains then we need to make sure the cluster is accessible via non-ssl
					enforceSSLAccess:
						updatedList.length === 0 ? false : cluster.enforceSSLAccess,
				}
			);

			// Remove the domain from the domain list
			await domainCtrl.deleteOneByQuery({ domain });

			res.json(updatedCluster);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/cluster/domains/enforce-ssl
@method     PUT
@desc       Turns on or off enforce ssl access to the cluster
@access     public
*/
router.put(
	"/domains/enforce-ssl",
	checkContentType,
	authSession,
	validateCluster,
	applyRules("update-enforce-ssl"),
	validate,
	async (req, res) => {
		try {
			const { user, cluster } = req;
			if (!user.isClusterOwner) {
				return res.status(401).json({
					error: t("Not Authorized"),
					details: t(
						"You are not authorized to manage cluster SSL access settings. Only the cluster owner can manage cluster access settings."
					),
					code: ERROR_CODES.unauthorized,
				});
			}

			const { enforceSSLAccess } = req.body;

			if (enforceSSLAccess && cluster.domains.length === 0) {
				return res.status(401).json({
					error: t("Not Allowed"),
					details: t(
						"You can enforce SSL access to your cluster only if you have a least one domain added to the custom domains list."
					),
					code: ERROR_CODES.notAllowed,
				});
			}

			// Get all container ingresses that will be impacted
			let containers = await cntrCtrl.getManyByQuery(
				{
					$or: [
						{ "networking.ingress.enabled": true },
						{ "networking.customDomain.enabled": true },
					],
				},
				{ lookup: "environmentId" }
			);

			containers = containers.map((entry) => {
				return {
					containeriid: entry.iid,
					namespace: entry.environmentId.iid,
					ingress: entry.networking.ingress.enabled,
					customDomain: entry.networking.customDomain.enabled,
				};
			});

			if (containers?.length > 0) {
				for (const entry of containers) {
					if (entry.ingress)
						await updateEnforceSSLAccessSettings(
							`${entry.containeriid}-cluster`,
							entry.namespace,
							enforceSSLAccess
						);

					if (entry.customDomain)
						await updateEnforceSSLAccessSettings(
							`${entry.containeriid}-domain`,
							entry.namespace,
							enforceSSLAccess
						);
				}
			}

			// Update cluster SSL access information
			let updatedCluster = await clsCtrl.updateOneById(cluster._id, {
				enforceSSLAccess,
			});

			res.json(updatedCluster);
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

export default router;
