import express from "express";
import cors from "cors";
import helmet from "helmet";
import nocache from "nocache";
import process from "process";
import config from "config";
import responseTime from "response-time";
import logger from "./init/logger.js";
import helper from "./util/helper.js";
import { connectToRedisCache, disconnectFromRedisCache } from "./init/cache.js";
import { setUpSyncServer } from "./init/sync.js";
import { createRateLimiter } from "./middlewares/rateLimiter.js";
import { handleUndefinedPaths } from "./middlewares/undefinedPaths.js";
import { logRequest } from "./middlewares/logRequest.js";

(function () {
	console.info(`Process ${process.pid} is running`);
	// Init globally accessible variables
	initGlobals();
	// Connect to cache server(s)
	connectToRedisCache();
	// Spin up http server
	const { expressServer, syncServer } = initExpress();
	// Gracefull handle process exist
	handleProcessExit(expressServer, syncServer);
})();

function initGlobals() {
	// Add logger to the global object
	global.logger = logger;

	// To correctly identify errors thrown by the platform vs. system thrown errors
	global.AgnostError = class extends Error {
		constructor(message) {
			super(message);
		}
	};
	// Add config to the global object
	global.config = config;
	// Add utility methods to the global object
	global.helper = helper;
}

async function initExpress() {
	// Create express application
	var app = express();
	// Add rate limiter middlewares
	let rateLimiters = config.get("rateLimiters");
	rateLimiters.forEach((entry) => app.use(createRateLimiter(entry)));
	//Secure express app by setting various HTTP headers
	app.use(helmet());
	//Enable cross-origin resource sharing
	app.use(cors());
	//Disable client side caching
	app.use(nocache());
	app.set("etag", false);
	app.use(responseTime(logRequest));

	app.use("/", (await import("./routes/system.js")).default);

	// Middleware to handle undefined paths or posts
	app.use(handleUndefinedPaths);

	// Spin up the http server
	const HOST = config.get("server.host");
	const PORT = config.get("server.port");
	var server = app.listen(PORT, () => {
		console.info(`Http server started @ ${HOST}:${PORT}`);
	});

	/* 	Particularly needed in case of bulk insert/update/delete operations, we should not generate 502 Bad Gateway errors at nginex ingress controller, the value specified in default config file is in milliseconds */
	server.timeout = config.get("server.timeout");

	// Spin up sync server. We need to make sure that sync server is spin up after the express server starts
	const syncServer = setUpSyncServer(server);

	// Set up garbage collector to manage memory consumption of the websotket server
	setUpGC();

	return { expressServer: server, syncServer };
}

function setUpGC() {
	setInterval(() => {
		if (global.gc) {
			// Manually hangle gc to boost performance of our websotket server, gc is an expensive operation
			global.gc();
		}
	}, config.get("general.gcSeconds") * 1000);
}

function handleProcessExit(expressServer, syncServer) {
	//Gracefully exit if we force quit through cntr+C
	process.on("SIGINT", () => {
		// Close connection to cache server(s)
		disconnectFromRedisCache();
		//Close Http server
		expressServer.close(() => {
			console.info("Http server closed");
		});
		//Close synchronization server
		syncServer.close(() => {
			console.info("Synchronization server closed");
		});
	});
}
