import helper from "../util/helper.js";
import ERROR_CODES from "../config/errorCodes.js";

export const projectAuthorization = {
	Admin: {
		project: {
			view: true,
			update: true,
			delete: true,
			transfer: true,
			viewLogs: true,
			invite: {
				view: true,
				create: true,
				update: true,
				resend: true,
				delete: true,
			},
			team: {
				view: true,
				update: true,
				delete: true,
			},
			environment: {
				view: true,
				create: true,
				update: true,
				delete: true,
			},
			container: {
				view: true,
				create: true,
				update: true,
				delete: true,
			},
		},
	},
	Developer: {
		project: {
			view: true,
			update: false,
			delete: false,
			transfer: false,
			viewLogs: false,
			invite: {
				view: false,
				create: false,
				update: false,
				resend: false,
				delete: false,
			},
			team: {
				view: true,
				update: false,
				delete: false,
			},
			environment: {
				view: true,
				create: true,
				update: true,
				delete: true,
			},
			container: {
				view: true,
				create: true,
				update: true,
				delete: true,
			},
		},
	},
	Viewer: {
		project: {
			view: true,
			update: false,
			delete: false,
			transfer: false,
			viewLogs: false,
			invite: {
				view: false,
				create: false,
				update: false,
				resend: false,
				delete: false,
			},
			team: {
				view: true,
				update: false,
				delete: false,
			},
			environment: {
				view: true,
				create: false,
				update: false,
				delete: false,
			},
			container: {
				view: true,
				create: false,
				update: false,
				delete: false,
			},
		},
	},
};

// Middleare to create the error message for failed request input validations
export const authorizeProjectAction = (action = null) => {
	return async (req, res, next) => {
		try {
			let entity = projectAuthorization[req.projectMember.role];
			if (action && entity) {
				let items = action.split(".");
				for (let i = 0; i < items.length - 1; i++) {
					entity = entity[items[i]];
					if (!entity) break;
				}

				if (entity && entity[items[items.length - 1]]) return next();
			}

			return res.status(401).json({
				error: "Not Authorized",
				details: `You are not authorized to perform '${action}' action on project '${req.project.name}'`,
				code: ERROR_CODES.unauthorized,
			});
		} catch (err) {
			return helper.handleError(req, res, err);
		}
	};
};
