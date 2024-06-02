import express from "express";
import { authSession } from "../middlewares/authSession.js";
import {
	orgRoles,
	orgRoleDesc,
	projectRoles,
	projectRoleDesc,
} from "../config/constants.js";
import { timezones } from "../config/timezones.js";

const router = express.Router({ mergeParams: true });

/*
@route      /all
@method     GET
@desc       Returns all types used in the platform
@access     public
*/
router.get("/all", authSession, (req, res) => {
	res.json({
		orgRoles,
		orgRoleDesc,
		projectRoles,
		projectRoleDesc,
		timezones,
	});
});

export default router;
