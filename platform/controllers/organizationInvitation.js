import BaseController from "./base.js";
import { OrgInvitationModel } from "../schemas/organizationInvitation.js";

class OrgInvitationController extends BaseController {
	constructor() {
		super(OrgInvitationModel);
	}

	/**
	 * Updates the matching host name in all organization invitaions
	 * @param  {string} userId The user identifier
	 * @param  {string} name The name of the user
	 */
	async updateHostName(userId, name) {
		await this.updateMultiByQuery(
			{ "host.userId": userId },
			{ "host.name": name },
			{},
			{ writeConcern: { w: 0 } }
		);
	}

	/**
	 * Updates the matching host profile image in all organization invitaions
	 * @param  {string} userId The user identifier
	 * @param  {string} pictureUrl The url of the profile picture
	 */
	async updateHostPicture(userId, pictureUrl) {
		await this.updateMultiByQuery(
			{ "host.userId": userId },
			{ "host.pictureUrl": pictureUrl },
			{},
			{ writeConcern: { w: 0 } }
		);
	}

	/**
	 * Removes the matching host profile image in all organization invitaions
	 * @param  {string} userId The user identifier
	 */
	async removeHostPicture(userId) {
		await this.updateMultiByQuery(
			{ "host.userId": userId },
			{},
			{ "host.pictureUrl": 1 },
			{ writeConcern: { w: 0 } }
		);
	}
}

export default new OrgInvitationController();
