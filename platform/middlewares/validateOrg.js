import orgCtrl from "../controllers/organization.js";
import orgMemberCtrl from "../controllers/organizationMember.js";
import helper from "../util/helper.js";

import ERROR_CODES from "../config/errorCodes.js";

export const validateOrg = async (req, res, next) => {
	try {
		const { orgId } = req.params;

		// Get the organization object
		let org = await orgCtrl.getOneById(orgId, { cacheKey: orgId });

		if (!org) {
			return res.status(404).json({
				error: "Not Found",
				details: `No such organization with the provided id '${orgId}' exists.`,
				code: ERROR_CODES.notFound,
			});
		}

		// If we have the user information, in case of endpoints called by the master token we do not have user info
		if (req.user) {
			// If the user is cluster owner then by default he has 'Admin' privileges to the organization
			if (req.user.isClusterOwner) {
				// Assign organization membership data
				req.orgMember = {
					orgId,
					userId: req.user._id,
					role: "Admin",
					joinDate: req.user.createdAt,
				};
			} else {
				// Check if the user is a member of the orgnization or not
				let orgMember = await orgMemberCtrl.getOneByQuery(
					{
						userId: req.user._id,
						orgId: orgId,
					},
					{ cacheKey: `${orgId}.${req.user._id}` }
				);

				if (!orgMember) {
					return res.status(401).json({
						error: "Not Authorized",
						details: `You are not a member of the organization '${org.name}'`,
						code: ERROR_CODES.unauthorized,
					});
				}
				// Assign organization membership data
				req.orgMember = orgMember;
			}
		}

		// Assign organization membership data
		req.org = org;

		next();
	} catch (err) {
		return helper.handleError(req, res, err);
	}
};
