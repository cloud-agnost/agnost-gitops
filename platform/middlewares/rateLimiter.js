import { RateLimiterRedis } from "rate-limiter-flexible";
import { getRedisClient } from "../init/cache.js";
import ERROR_CODES from "../config/errorCodes.js";

// Apply rate limits to platform endpoints
export const createRateLimiter = (rateLimitConfig) => {
	const rateLimiter = new RateLimiterRedis({
		storeClient: getRedisClient(),
		points: rateLimitConfig.rateLimitMaxHits, // Limit each unique identifier (IP or userId) to N requests per `window`
		duration: rateLimitConfig.rateLimitWindowSec, // Window duration in seconds
	});

	return (req, res, next) => {
		rateLimiter
			.consume(helper.getIP(req))
			.then(() => {
				next();
			})
			.catch(() => {
				return res.status(429).json({
					error: t("Rate Limit Exceeded"),
					details: t("Too many requests, please try again later."),
					code: ERROR_CODES.rateLimitExceeded,
				});
			});
	};
};
