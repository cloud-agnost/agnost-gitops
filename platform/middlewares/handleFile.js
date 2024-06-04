import config from "config";
import multer, { memoryStorage } from "multer";
import ERROR_CODES from "../config/errorCodes.js";

// Multer is required to process file uploads and make them available via req.files.
const fileUpload = multer({
	storage: memoryStorage(),
	limits: {
		fileSize: config.get("general.maxImageSizeMB") * 1000 * 1000,
	},
}).single("picture");

export const fileUploadMiddleware = (req, res, next) => {
	fileUpload(req, res, function (err) {
		if (err instanceof multer.MulterError) {
			// Handle Multer-specific errors
			if (err.code === "LIMIT_FILE_SIZE") {
				return res.status(400).json({
					error: "File Too Large",
					code: ERROR_CODES.fileSizeTooLarge,
					details: `File size exceeds the limit of ${config.get(
						"general.maxImageSizeMB"
					)}MB.`,
				});
			}
			return res.status(500).json({
				error: "File Upload Error",
				code: ERROR_CODES.fileUploadError,
				details: `An error has occured when uploading the file. ${err.message}`,
			});
		} else if (err) {
			return res.status(500).json({
				error: "File Upload Error",
				code: ERROR_CODES.fileUploadError,
				details: `An error has occured when uploading the file. ${err.message}`,
			});
		}
		// If everything went fine, move to the next middleware
		next();
	});
};
