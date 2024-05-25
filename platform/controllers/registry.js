import BaseController from "./base.js";
import { RegistryModel } from "../schemas/registry.js";

class RegistryController extends BaseController {
	constructor() {
		super(RegistryModel);
	}
}

export default new RegistryController();
