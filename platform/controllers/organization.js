import BaseController from "./base.js";
import auditCtrl from "../controllers/audit.js";
import orgMemberCtrl from "../controllers/organizationMember.js";
import orgInvitationCtrl from "./organizationInvitation.js";
import prjCtrl from "../controllers/project.js";
import prjEnvCtrl from "../controllers/environment.js";
import prjInvitationCtrl from "../controllers/projectInvitation.js";
import cntrCtrl from "../controllers/container.js";

import { OrganizationModel } from "../schemas/organization.js";

class OrganizationController extends BaseController {
	constructor() {
		super(OrganizationModel);
	}

	/**
	 * Delete all organization related data
	 * @param  {Object} session The database session object
	 * @param  {Object} org The organization object that will be deleted
	 */
	async deleteOrganization(session, org) {
		await this.deleteOneById(org._id, { session, cacheKey: org._id });
		await orgMemberCtrl.deleteManyByQuery({ orgId: org._id }, { session });
		await orgInvitationCtrl.deleteManyByQuery({ orgId: org._id }, { session });
		await prjCtrl.deleteManyByQuery({ orgId: org._id }, { session });
		await prjEnvCtrl.deleteManyByQuery({ orgId: org._id }, { session });
		await prjInvitationCtrl.deleteManyByQuery({ orgId: org._id }, { session });
		await cntrCtrl.deleteManyByQuery({ orgId: org._id }, { session });
		await auditCtrl.deleteManyByQuery({ orgId: org._id }, { session });
	}
}

export default new OrganizationController();
