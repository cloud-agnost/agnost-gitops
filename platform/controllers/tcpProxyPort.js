import BaseController from "./base.js";
import { TCPProxyPortModel } from "../schemas/tcpProxyPort.js";

class TCPProxyPortController extends BaseController {
	constructor() {
		super(TCPProxyPortModel);
	}
}

export default new TCPProxyPortController();
