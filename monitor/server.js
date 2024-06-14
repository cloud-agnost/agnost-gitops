import express from "express";
import process from "process";
import config from "config";
import responseTime from "response-time";
import logger from "./init/logger.js";
import { monitorContainers } from "./handler/monitorContainers.js";
import { monitorAccessTokens } from "./handler/monitorAccessTokens.js";
import { connectToDatabase, disconnectFromDatabase } from "./init/db.js";
import { handleUndefinedPaths } from "./middlewares/undefinedPaths.js";
import { logRequest } from "./middlewares/logRequest.js";
import {
	watchBuildEvents,
	stopWatchingBuildEvents,
} from "./handler/watchTaskRuns.js";

var processing = false;
var processingTokens = false;

(async function () {
	console.info(`Process ${process.pid} is running`);
	// Init globally accessible variables
	initGlobals();
	// Connect to the database
	await connectToDatabase();
	// Spin up http server
	const server = initExpress();
	// Launch scheduler
	initMonitoringScheduler();

	watchBuildEvents().catch((err) => {
		console.error(`Watch build events error. ${err}`);
	});

	// Gracefull handle process exist
	handleProcessExit(server);
})();

function initGlobals() {
	// Add logger to the global object
	global.logger = logger;
}

async function initExpress() {
	// Create express application
	var app = express();
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

	// Set up garbage collector to manage memory consumption
	setUpGC();

	return server;
}

function initMonitoringScheduler() {
	setInterval(async () => {
		// If we are already monitoring the resources skip this cycle
		if (processing) return;
		else {
			processing = true;
			await monitorContainers();
			processing = false;
		}
	}, config.get("general.monitoringInterval"));

	setInterval(async () => {
		// If we are already monitoring the tokens skip this cycle
		if (processingTokens) return;
		else {
			processingTokens = true;
			await monitorAccessTokens();
			processingTokens = false;
		}
	}, config.get("general.monitoringIntervalTokens"));
}

function setUpGC() {
	setInterval(() => {
		if (global.gc) {
			// Manually hangle gc to boost performance of our monitoring server, gc is an expensive operation
			global.gc();
		}
	}, config.get("general.gcSeconds") * 1000);
}

function handleProcessExit(server) {
	//Gracefully exit if we force quit through cntr+C
	process.on("SIGINT", () => {
		// Close connection to the database
		disconnectFromDatabase();
		//Close Http server
		server.close(() => {
			console.info("Http server closed");
		});
		// Stop watching build events
		stopWatchingBuildEvents();
	});
}
