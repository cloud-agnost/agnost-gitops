import BaseController from "./base.js";
import { ContainerModel } from "../schemas/container.js";

class ContainerController extends BaseController {
	constructor() {
		super(ContainerModel);
	}
}

export default new ContainerController();
