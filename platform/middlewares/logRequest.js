// Log requests to console
export const logRequest = (req, res, time) => {
	if (req.originalUrl !== "/health")
		logger.info(
			`${req.method} (${res.statusCode}) ${Math.round(time * 10) / 10}ms ${
				req.originalUrl
			}`
		);
};
