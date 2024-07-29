import express from "express";
import config from "config";
import { storage } from "../init/storage.js";
import helper from "../util/helper.js";

const router = express.Router({ mergeParams: true });

/*
@route      /storage/avatars/:file
@method     GET
@desc       Returns the file stored in minio bucket
@access     public
*/
router.get("/avatars/:file", async (req, res) => {
	try {
		const { file } = req.params;
		const bucketName = config.get("general.storageBucket");
		const fileName = `storage/avatars/${file}`;

		const fileStat = await storage.getFileStat(bucketName, fileName);
		const dataStream = await storage.getFileStream(bucketName, fileName);

		// Set cache and content-type headers
		res.set("Content-Type", fileStat.metaData["content-type"]);
		res.set("Cross-Origin-Resource-Policy", "cross-origin");
		res.set("Access-Control-Allow-Origin", "*");
		res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
		res.set("Cache-Control", "public, max-age=31536000");
		res.set("ETag", fileStat.etag); // Replace with actual ETag
		res.set("Expires", new Date(Date.now() + 31536000000).toUTCString()); // 1 year from now
		res.set("Pragma", "cache"); // Encourage caching
		res.set("Last-Modified", fileStat.lastModified); // Replace with actual date

		dataStream.pipe(res);
	} catch (error) {
		helper.handleError(req, res, error);
	}
});

export default router;
