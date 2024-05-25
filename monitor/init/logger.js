import winston from "winston";
import axios from "axios";
import Transport from "winston-transport";
import ERROR_CODES from "../config/errorCodes.js";

const { combine, timestamp, printf } = winston.format;

// Custom transport to save error logs in MongoDB
class EngineErrorTransport extends Transport {
	constructor(opts) {
		super(opts);
	}

	log(log, callback) {
		let entry = {
			source: "engine-monitor",
			orgId: log.details?.orgId,
			appId: log.details?.appId,
			versionId: log.details?.versionId,
			envId: log.details?.envId,
			type: "monitor",
			name: log.details?.name,
			message: log.details?.message,
			details: log.message,
			stack: log.details?.stack,
			payload: log.details?.payload,
			code: ERROR_CODES.internalServerError,
		};

		//Make api call to the platform to log the error message
		axios
			.post(helper.getPlatformUrl() + "/v1/engine/error", entry, {
				headers: {
					Authorization: process.env.MASTER_TOKEN,
					"Content-Type": "application/json",
				},
			})
			.catch((error) => {});

		callback();
	}
}

const logFormat = printf(({ level, message, label, timestamp }) => {
	return `${timestamp} ${level}: ${message}`;
});

const logger = winston.createLogger({
	transports: [
		new winston.transports.Console({
			format: combine(timestamp(), logFormat),
			handleExceptions: true,
			level: "info",
			silent: false,
			/* process.env.NODE_ENV == 'production' || process.env.NODE_ENV === 'demo'
					? true
					: false, */
		}),
		new EngineErrorTransport({ level: "error" }),
	],
});

export default logger;
