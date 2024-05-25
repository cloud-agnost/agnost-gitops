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
					error: t("File Too Large"),
					code: ERROR_CODES.fileSizeTooLarge,
					details: t(
						"File size exceeds the limit of %sMB.",
						config.get("general.maxImageSizeMB")
					),
				});
			}
			return res.status(500).json({
				error: t("File Upload Error"),
				code: ERROR_CODES.fileUploadError,
				details: t(
					"An error has occured when uploading the file. %s",
					err.message
				),
			});
		} else if (err) {
			return res.status(500).json({
				error: t("File Upload Error"),
				code: ERROR_CODES.fileUploadError,
				details: t(
					"An error has occured when uploading the file. %s",
					err.message
				),
			});
		}
		// If everything went fine, move to the next middleware
		next();
	});
};
