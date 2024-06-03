import helper from "../util/helper.js";
import ERROR_CODES from "../config/errorCodes.js";

export const orgAuthorization = {
	Admin: {
		org: {
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
			member: {
				view: true,
				update: true,
				delete: true,
			},
			project: {
				view: true,
				viewAll: true,
				create: true,
				update: true,
			},
		},
	},
	Member: {
		org: {
			update: false,
			delete: false,
			transfer: false,
			viewLogs: true,
			invite: {
				view: true,
				create: false,
				update: false,
				resend: false,
				delete: false,
			},
			member: {
				view: true,
				update: false,
				delete: false,
			},
			project: {
				view: true,
				viewAll: true,
				create: false,
				update: false,
			},
		},
	},
};

// Middleare to create the error message for failed request input validations
export const authorizeOrgAction = (action = null) => {
	return async (req, res, next) => {
		try {
			let entity = orgAuthorization[req.orgMember.role];
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
				details: `You are not authorized to perform '${action}' action on an organization '${req.org.name}'`,
				code: ERROR_CODES.unauthorized,
			});
		} catch (err) {
			return helper.handleError(req, res, err);
		}
	};
};
