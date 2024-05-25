import winston from "winston";
const { combine, timestamp, printf } = winston.format;

const logFormat = printf((log) => {
	let { level, message, label, timestamp } = log;
	return `${timestamp} ${level}: ${message}`;
});

const logger = winston.createLogger({
	transports: [
		new winston.transports.Console({
			format: combine(timestamp(), logFormat),
			handleExceptions: true,
			level: "info",
			silent: false,
		}),
	],
});

export default logger;
