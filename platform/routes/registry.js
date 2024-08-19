import express from "express";
import regCtrl from "../controllers/registry.js";
import { authSession } from "../middlewares/authSession.js";
import helper from "../util/helper.js";

const router = express.Router({ mergeParams: true });

/*
@route      /v1/registry
@method     GET
@desc       Get all registries for the cluster
@access     private
*/
router.get("/", authSession, async (req, res) => {
	try {
		const registries = await regCtrl.getManyByQuery({});
		res.json(registries);
	} catch (err) {
		helper.handleError(req, res, err);
	}
});

export default router;
