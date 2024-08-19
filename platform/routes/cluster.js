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
import { removeClusterDomainFromIngresses } from "../handlers/ingress.js";
import { updateClusterContainerReleases } from "../handlers/cluster.js";
import { getAllStorageUsageInfo } from "../handlers/usage.js";
import {
	createClusterDomainCertificate,
	deleteClusterDomainCertificate,
} from "../handlers/certificate.js";
import helper from "../util/helper.js";
import { templates } from "../handlers/templates/index.js";

import ERROR_CODES from "../config/errorCodes.js";

const router = express.Router({ mergeParams: true });

/*
@route      /v1/cluster/setup-status
@method     GET
@desc       Returns true if cluster set-up is complete otherwise returns false
@access     public
*/
router.get("/setup-status", async (req, res) => {
	try {
		// Get cluster owner
		let user = await userCtrl.getOneByQuery({ isClusterOwner: true });
		res.status(200).json({ status: user ? true : false });
	} catch (error) {
		helper.handleError(req, res, error);
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
@route      /v1/cluster/storage-info
@method     GET
@desc       Returns information about the storage utilization data for agnost components
@access     public
*/
router.get("/storage-info", authSession, async (req, res) => {
	try {
		const result = await getAllStorageUsageInfo();
		res.json(result);
	} catch (error) {
		helper.handleError(req, res, error);
	}
});

/*
@route      /v1/cluster/templates
@method     GET
@desc       Returns the list of available container templates for the cluster
@access     public
*/
router.get("/templates", authSession, async (req, res) => {
	try {
		// Only return the templates that have the latest version
		let latestTemplates = templates.map((entry) => {
			entry.templates = entry.templates.filter((template) => template.isLatest);
			return entry;
		});
		res.json(latestTemplates);
	} catch (error) {
		helper.handleError(req, res, error);
	}
});

/*
@route      /v1/cluster/template?name=templateName&version=templateVersion
@method     GET
@desc       Returns info about a specific template
@access     public
*/
router.get(
	"/template",
	authSession,
	applyRules("get-template"),
	validate,
	async (req, res) => {
		try {
			const { name, version } = req.query;
			for (const category of templates) {
				for (const template of category.templates) {
					if (template.name === name && template.version === version) {
						return res.json(template);
					}
				}
			}

			res.status(404).json({
				error: "Not Found",
				details:
					"The container template with the provided name and version cannot be found.",
				code: ERROR_CODES.notFound,
			});
		} catch (error) {
			helper.handleError(req, res, error);
		}
	}
);

/*
@route      /v1/cluster/containers
@method     GET
@desc       Returns the list of cluster containers
@access     public
*/
router.get("/containers", authSession, async (req, res) => {
	try {
		const containers = await cntrCtrl.getManyByQuery({ isClusterEntity: true });
		res.json(containers);
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
		const cluster = await clsCtrl.getOneByQuery(
			{
				clusterAccesssToken: process.env.CLUSTER_ACCESS_TOKEN,
			},
			{
				cacheKey: process.env.CLUSTER_ACCESS_TOKEN,
			}
		);

		if (!cluster.release) {
			return res.status(404).json({
				error: "Not Found",
				details: "Release information not found.",
				code: ERROR_CODES.notFound,
			});
		}

		const latest = await axios.get(
			"https://raw.githubusercontent.com/cloud-agnost/agnost-gitops/main/releases/latest.json",
			{
				headers: {
					Accept: "application/vnd.github.v3+json",
				},
			}
		);

		const current = await axios.get(
			`https://raw.githubusercontent.com/cloud-agnost/agnost-gitops/main/releases/${cluster.release}.json`,
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
					error: "Not Authorized",
					details:
						"You are not authorized to update cluster release number. Only the cluster owner can manage cluster core components.",
					code: ERROR_CODES.unauthorized,
				});
			}

			// Get cluster configuration
			const cluster = await clsCtrl.getOneByQuery(
				{
					clusterAccesssToken: process.env.CLUSTER_ACCESS_TOKEN,
				},
				{
					cacheKey: process.env.CLUSTER_ACCESS_TOKEN,
				}
			);

			const { release } = req.body;

			// If existing and new release are the same do nothing
			if (cluster.release === release) return res.json(cluster);

			let oldReleaseInfo = null;
			let newReleaseInfo = null;

			try {
				oldReleaseInfo = await axios.get(
					`https://raw.githubusercontent.com/cloud-agnost/agnost-gitops/main/releases/${cluster.release}.json`,
					{
						headers: {
							Accept: "application/vnd.github.v3+json",
						},
					}
				);
			} catch (err) {
				console.error(err);
				return res.status(404).json({
					error: "Not Found",
					details: `There is no such Agnost release '${cluster.release}'.`,
					code: ERROR_CODES.notFound,
				});
			}

			try {
				newReleaseInfo = await axios.get(
					`https://raw.githubusercontent.com/cloud-agnost/agnost-gitops/main/releases/${release}.json`,
					{
						headers: {
							Accept: "application/vnd.github.v3+json",
						},
					}
				);
			} catch (err) {
				console.error(err);
				return res.status(404).json({
					error: "Not Found",
					details: `There is no such Agnost release '${release}'.`,
					code: ERROR_CODES.notFound,
				});
			}

			// Indetify the deployments whose release number has changed
			const requiredUpdates = [];
			for (const [key, value] of Object.entries(oldReleaseInfo.data.modules)) {
				if (value !== newReleaseInfo.data.modules[key]) {
					const entry = {
						containeriid: `${key}`,
						tag: newReleaseInfo.data.modules[key],
						image: `europe-docker.pkg.dev/agnost-gitops/images/${key}:${newReleaseInfo.data.modules[key]}`,
					};

					requiredUpdates.push(entry);
				}
			}

			// If no updates do nothing
			if (requiredUpdates.length === 0) return res.json(cluster);

			// Update the image tag of cluster containers (deployments)
			await updateClusterContainerReleases(requiredUpdates);

			// Update cluster release information
			let updatedCluster = await clsCtrl.updateOneByQuery(
				{
					clusterAccesssToken: process.env.CLUSTER_ACCESS_TOKEN,
				},
				{
					release: release,
					releaseHistory: [...cluster.releaseHistory, { release: release }],
				},
				{},
				{
					cacheKey: process.env.CLUSTER_ACCESS_TOKEN,
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
@route      /v1/cluster/reverse-proxy-url
@method     PUT
@desc       Sets the reverse proxy url for the cluster
@access     public
*/
router.put(
	"/reverse-proxy-url",
	checkContentType,
	authSession,
	validateCluster,
	applyRules("set-reverse-proxy-url"),
	validate,
	async (req, res) => {
		try {
			const { user, cluster } = req;
			const { reverseProxyURL } = req.body;

			if (!user.isClusterOwner) {
				return res.status(401).json({
					error: "Not Authorized",
					details:
						"You are not authorized to update cluster reverse proxy URL. Only the cluster owner can manage cluster settings.",
					code: ERROR_CODES.unauthorized,
				});
			}

			if (reverseProxyURL) {
				// Update cluster reverse proxy URL
				let updatedCluster = await clsCtrl.updateOneById(
					cluster._id,
					{
						reverseProxyURL,
					},
					{},
					{
						cacheKey: process.env.CLUSTER_ACCESS_TOKEN,
					}
				);

				return res.json(updatedCluster);
			} else {
				// Unset cluster reverse proxy URL
				let updatedCluster = await clsCtrl.updateOneById(
					cluster._id,
					{},
					{ reverseProxyURL: "" },
					{
						cacheKey: process.env.CLUSTER_ACCESS_TOKEN,
					}
				);

				return res.json(updatedCluster);
			}
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
					error: "Not Authorized",
					details:
						"You are not authorized to set the custom domain of the cluster. Only the cluster owner can manage the cluster custom domain.",
					code: ERROR_CODES.unauthorized,
				});
			}

			const domains = cluster.domains ?? [];
			const { domain } = req.body;

			if (domains.length > 0) {
				return res.status(401).json({
					error: "Not Allowed",
					details: `The custom domain of the cluster has already been set to '${domains[0]}'. If you want to set a new custom domain then first remove the existing domain.`,
					code: ERROR_CODES.notAllowed,
				});
			}

			// Create the certificate for the domain
			await createClusterDomainCertificate(domain);

			// Update cluster domains information
			let updatedCluster = await clsCtrl.updateOneById(
				cluster._id,
				{
					domains: [...domains, domain],
					certificateStatus: "Issuing",
				},
				{},
				{
					cacheKey: process.env.CLUSTER_ACCESS_TOKEN,
				}
			);

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
					error: "Not Authorized",
					details:
						"You are not authorized to manage the custom domain of the cluster. Only the cluster owner can manage the cluster custom domain.",
					code: ERROR_CODES.unauthorized,
				});
			}

			const domains = cluster.domains ?? [];
			const { domain } = req.body;

			// If nothing to delete then return
			if (cluster.domains.length === 0) return res.json(cluster);

			// Delete the certificate for the domain
			await deleteClusterDomainCertificate();

			// Get all container ingresses that will be impacted
			// The impacted ones will be the ingresses of "platform" and "sync" container.
			// Subdomain based ingresses will not be impacted since we do not allow delete of cluster domain if there are subdomain based ingresses
			let containers = await cntrCtrl.getManyByQuery(
				{
					"networking.ingress.enabled": true,
					"networking.ingress.type": "path",
				},
				{ lookup: "environmentId" }
			);

			// Remove the domain from the container ingresses
			await removeClusterDomainFromIngresses(containers, domain);

			// Update cluster domains information
			const updatedList = domains.filter((entry) => entry !== domain);

			// Update cluster domains information
			let updatedCluster = await clsCtrl.updateOneByQuery(
				{
					clusterAccesssToken: process.env.CLUSTER_ACCESS_TOKEN,
				},
				{
					domains: updatedList,
				},
				{
					certificateStatus: "",
				},
				{
					cacheKey: process.env.CLUSTER_ACCESS_TOKEN,
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

export default router;
