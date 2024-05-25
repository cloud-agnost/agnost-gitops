import express from "express";
import { authAccessToken } from "../middlewares/authAccessToken.js";

const router = express.Router({ mergeParams: true });

/*
@route      /health
@method     GET
@desc       Checks liveliness of engine worker
@access     public
*/
router.get("/health", (req, res) => {
	res
		.status(200)
		.send(
			new Date().toISOString() +
				" - Healthy engine worker server" +
				" - " +
				process.env.RELEASE_NUMBER
		);
});

/*
@route      /ping
@method     GET
@desc       Checks liveliness of engine worker
@access     public
*/
router.get("/ping", (req, res) => {
	res.status(200).send(new Date().toISOString() + " - Pong!");
});

/*
@route      /validate
@method     GET
@desc       Checks access token
@access     public
*/
router.get("/validate", authAccessToken, (req, res) => {
	res.status(200).send(new Date().toISOString() + " - Access token validated");
});

export default router;
