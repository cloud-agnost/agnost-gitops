import BaseController from "./base.js";
import { DomainModel } from "../schemas/domain.js";

class DomainController extends BaseController {
	constructor() {
		super(DomainModel);
	}
}

export default new DomainController();
