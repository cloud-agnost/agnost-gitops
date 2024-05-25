import BaseController from "./base.js";
import { AuditModel } from "../schemas/audit.js";
import { sendMessage } from "../init/sync.js";

class AuditController extends BaseController {
	constructor() {
		super(AuditModel);
	}

	/**
	 * Creates a new audit log in the database
	 * @param  {object} user The user who performed the action
	 * @param  {string} object The impacted object type
	 * @param  {string} action Action type
	 * @param  {string} description Human readable descriptive text of the action
	 * @param  {object} data The audit paylaod JSON object
	 * @param  {object} data The specific object identifiers of the log (e.g., orgId, appId, versionId)
	 */
	async log(user, object, action, description, data, identifiers = {}) {
		await this.create(
			{
				object,
				...identifiers,
				action,
				description,
				data,
				actor: {
					userId: user._id,
					name: user.name,
					pictureUrl: user.pictureUrl,
					color: user.color,
					email: user.email,
				},
			},
			{ w: 0 }
		);
	}

	/**
	 * Creates a new audit log in the database and sends realtime notification to connected channel members
	 * @param  {string} channel The channel to send the message
	 * @param  {object} user The user who performed the action
	 * @param  {string} object The impacted object type
	 * @param  {string} action Action type
	 * @param  {string} description Human readable descriptive text of the action
	 * @param  {object} data The audit paylaod JSON object
	 * @param  {object} data The specific object identifiers of the log (e.g., orgId, appId, versionId)
	 */
	async logAndNotify(
		channel,
		user,
		object,
		action,
		description,
		data,
		identifiers = {}
	) {
		await this.log(user, object, action, description, data, identifiers);
		sendMessage(channel, {
			actor: {
				userId: user._id,
				name: user.name,
				pictureUrl: user.pictureUrl,
				color: user.color,
				email: user.email,
			},
			action,
			object,
			description,
			timestamp: Date.now(),
			data,
			identifiers,
		});
	}

	/**
	 * Updates the matching actor name in all audit logs
	 * @param  {string} userId The user identifier
	 * @param  {string} name The name of the user
	 */
	async updateActorName(userId, name) {
		await this.updateMultiByQuery(
			{ "actor.userId": userId },
			{ "actor.name": name },
			{},
			{ writeConcern: { w: 0 } }
		);
	}

	/**
	 * Updates the matching actor profile image in all audit logs
	 * @param  {string} userId The user identifier
	 * @param  {string} pictureUrl The url of the profile picture
	 */
	async updateActorPicture(userId, pictureUrl) {
		await this.updateMultiByQuery(
			{ "actor.userId": userId },
			{ "actor.pictureUrl": pictureUrl },
			{},
			{ writeConcern: { w: 0 } }
		);
	}

	/**
	 * Removes the matching actor profile image in all audit logs
	 * @param  {string} userId The user identifier
	 */
	async removeActorPicture(userId) {
		await this.updateMultiByQuery(
			{ "actor.userId": userId },
			{},
			{ "actor.pictureUrl": 1 },
			{ writeConcern: { w: 0 } }
		);
	}
}

export default new AuditController();
