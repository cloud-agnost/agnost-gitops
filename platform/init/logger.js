import winston from "winston";
const { combine, timestamp, printf } = winston.format;

const logFormat = printf((log) => {
	let { level, message, timestamp } = log;
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

/**
 * Formats the arguments array by converting any objects to JSON strings.
 *
 * @param {Array} args - The arguments array to be formatted.
 * @returns {Array} - The formatted arguments array.
 */
function formatArguments(args) {
	for (let i = 0; i < args.length; i++) {
		let param = args[i];
		if (param && typeof param === "object") {
			try {
				args[i] = JSON.stringify(param, null, 2);
			} catch (err) {
				args[i] = param.toString();
			}
		}
	}

	return args;
}

// Override the console methods to use Winston
console.info = (...args) => {
	args = formatArguments(args);
	logger.info(args.join(" "));
};

console.info = (...args) => {
	args = formatArguments(args);
	logger.info(args.join(" "));
};

console.error = (...args) => {
	args = formatArguments(args);
	logger.error(args.join(" "));
};

console.warn = (...args) => {
	args = formatArguments(args);
	logger.warn(args.join(" "));
};

export default logger;
