import BaseController from "./base.js";
import { GitProviderModel } from "../schemas/gitProvider.js";

class GitProviderController extends BaseController {
	constructor() {
		super(GitProviderModel);
	}
}

export default new GitProviderController();
