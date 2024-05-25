import winston from "winston";

const { combine, timestamp, printf } = winston.format;

const logFormat = printf(({ level, message, label, timestamp }) => {
	return `${timestamp} ${level}: ${message}${label ? "\n" + label : ""}`;
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
