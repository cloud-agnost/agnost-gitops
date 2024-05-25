import BaseController from "./base.js";
import { OrganizationMemberModel } from "../schemas/organizationMember.js";

class OrganizationMemberController extends BaseController {
	constructor() {
		super(OrganizationMemberModel);
	}
}

export default new OrganizationMemberController();
