import BaseController from "./base.js";
import { ProjectEnvModel } from "../schemas/environment.js";
import auditCtrl from "./audit.js";
import cntrCtrl from "./container.js";

class ProjectEnvController extends BaseController {
	constructor() {
		super(ProjectEnvModel);
	}

	/**
	 * Delete all project environment related data
	 * @param  {Object} session The database session object
	 * @param  {Object} org The organization object
	 * @param  {Object} project The project object
	 * @param  {Object} environment The environment object that will be deleted
	 */
	async deleteEnvironment(session, org, project, environment) {
		await this.deleteOneById(environment._id, {
			session,
			cacheKey: environment._id,
		});

		await cntrCtrl.deleteManyByQuery(
			{
				orgId: org._id,
				projectId: project._id,
				environmentId: environment._id,
			},
			{ session }
		);

		await auditCtrl.deleteManyByQuery(
			{
				orgId: org._id,
				projectId: project._id,
				environmentId: environment._id,
			},
			{ session }
		);
	}
}

export default new ProjectEnvController();
