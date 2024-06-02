import BaseController from "./base.js";
import { ClusterModel } from "../schemas/cluster.js";
import orgCtrl from "./organization.js";
import orgMemberCtrl from "./organizationMember.js";
import prjCtrl from "./project.js";
import prjEnvCtrl from "./environment.js";

import { getClusterIPs } from "../handlers/cluster.js";

class ClusterController extends BaseController {
	constructor() {
		super(ClusterModel);
	}

	async initializeCluster(session, user) {
		// Check if there is already a cluster configuration or not
		// If there is a configuration this means that the cluster has already been initialized
		const cluster = await this.getOneByQuery({
			clusterAccesssToken: process.env.CLUSTER_ACCESS_TOKEN,
		});

		if (cluster) return;

		// Save cluster config to the database
		await this.create(
			{
				clusterAccesssToken: process.env.CLUSTER_ACCESS_TOKEN,
				masterToken: process.env.MASTER_TOKEN,
				release: process.env.RELEASE_NUMBER,
				releaseHistory: [
					{ release: process.env.RELEASE_NUMBER, timestamp: Date.now() },
				],
				ips: await getClusterIPs(),
				createdBy: user._id,
			},
			{ session }
		);

		// Create the new organization object
		let orgId = helper.generateId();
		let org = await orgCtrl.create(
			{
				_id: orgId,
				ownerUserId: user._id,
				iid: helper.generateSlug("org"),
				name: "Agnost GitOps",
				color: helper.generateColor("light"),
				createdBy: user._id,
				isClusterEntity: true,
			},
			{ session, cacheKey: orgId }
		);

		// Add the creator of the organization as an 'Admin' member
		await orgMemberCtrl.create(
			{
				orgId: orgId,
				userId: user._id,
				role: "Admin",
			},
			{ session, cacheKey: `${orgId}.${user._id}` }
		);

		// Create the project
		const projectId = helper.generateId();
		const project = await prjCtrl.create(
			{
				_id: projectId,
				orgId: org._id,
				iid: helper.generateSlug("prj"),
				ownerUserId: user._id,
				name: "Cluster",
				color: helper.generateColor("light"),
				team: [{ userId: user._id, role: "Admin" }],
				createdBy: user._id,
				isClusterEntity: true,
			},
			{ session, cacheKey: projectId }
		);

		// Create the default environment of the project
		const environmentId = helper.generateId();
		const environment = await prjEnvCtrl.create(
			{
				_id: environmentId,
				orgId: org._id,
				projectId: project._id,
				iid: process.env.NAMESPACE, // Namespace is used as the environment iid
				name: process.env.NAMESPACE,
				private: false,
				readOnly: true,
				createdBy: user._id,
				isClusterEntity: true,
			},
			{ session, cacheKey: environmentId }
		);

		// Create cluster containers (e.g., platform, sync, monitor, mongodb, redis, minio)
		// TODO: Create cluster containers
	}
}

export default new ClusterController();
