import express from "express";

const router = express.Router({ mergeParams: true });

/*
@route      /
@method     GET
@desc       Checks liveliness of platform server
@access     public
*/
router.get("/health", (req, res) => {
	res
		.status(200)
		.send(
			`${new Date().toISOString()} - Healthy platform server - ${
				process.env.RELEASE_NUMBER
			}`
		);
});

/*
@route      /ping
@method     GET
@desc       Checks liveliness of platform server
@access     public
*/
router.get("/ping", (req, res) => {
	res.status(200).send(`${new Date().toISOString()} - Pong!`);
});

export default router;
