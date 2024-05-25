import BaseController from "./base.js";
import { UserModel } from "../schemas/user.js";

class UserController extends BaseController {
	constructor() {
		super(UserModel);
	}
}

export default new UserController();
