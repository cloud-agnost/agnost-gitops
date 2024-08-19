import express from "express";
import cors from "cors";
import helmet from "helmet";
import nocache from "nocache";
import process from "process";
import config from "config";
import responseTime from "response-time";
import logger from "./init/logger.js";
import { connectToDatabase, disconnectFromDatabase } from "./init/db.js";
import { connectToRedisCache, disconnectFromRedisCache } from "./init/cache.js";
import { createRateLimiter } from "./middlewares/rateLimiter.js";
import { handleUndefinedPaths } from "./middlewares/undefinedPaths.js";
import { logRequest } from "./middlewares/logRequest.js";
import { initializeSyncClient, disconnectSyncClient } from "./init/sync.js";

(function () {
	console.info(`Process ${process.pid} is running`);
	// Init globally accessible variables
	initGlobals();
	// Connect to the database
	connectToDatabase();
	// Connect to cache server(s)
	connectToRedisCache();
	// Spin up http server
	const server = initExpress();
	// Connect to synchronization server
	initializeSyncClient();

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
	// Add rate limiter middlewares
	let rateLimiters = config.get("rateLimiters");
	rateLimiters.forEach((entry) => app.use(createRateLimiter(entry)));
	//Secure express app by setting various HTTP headers
	app.use(helmet());
	//Enable cross-origin resource sharing
	app.use(
		cors({
			exposedHeaders: ["Access-Token", "Refresh-Token"],
		})
	);
	//Disable client side caching
	app.use(nocache());
	app.set("etag", false);
	app.use(responseTime(logRequest));
	app.use("/", (await import("./routes/system.js")).default);
	app.use("/storage", (await import("./routes/storage.js")).default);
	app.use("/v1/cluster", (await import("./routes/cluster.js")).default);
	app.use("/v1/registry", (await import("./routes/registry.js")).default);
	app.use("/v1/telemetry", (await import("./routes/telemetry.js")).default);
	app.use("/v1/types", (await import("./routes/types.js")).default);
	app.use("/v1/auth", (await import("./routes/auth.js")).default);
	app.use("/v1/user", (await import("./routes/user.js")).default);
	app.use("/v1/user/git", (await import("./routes/git.js")).default);
	app.use("/v1/log", (await import("./routes/log.js")).default);
	app.use("/v1/org", (await import("./routes/organization.js")).default);
	app.use(
		"/v1/org/:orgId/invite",
		(await import("./routes/organizationInvites.js")).default
	);
	app.use(
		"/v1/org/:orgId/team",
		(await import("./routes/organizationTeam.js")).default
	);
	app.use(
		"/v1/org/:orgId/project",
		(await import("./routes/project.js")).default
	);
	app.use(
		"/v1/org/:orgId/project/:projectId/invite",
		(await import("./routes/projectInvites.js")).default
	);
	app.use(
		"/v1/org/:orgId/project/:projectId/team",
		(await import("./routes/projectTeam.js")).default
	);
	app.use(
		"/v1/org/:orgId/project/:projectId/env",
		(await import("./routes/environment.js")).default
	);
	app.use(
		"/v1/org/:orgId/project/:projectId/env/:envId/container",
		(await import("./routes/container.js")).default
	);

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

	return server;
}

function handleProcessExit(server) {
	//Gracefully exit if we force quit through cntr+C
	process.on("SIGINT", () => {
		// Close synchronization server connection
		disconnectSyncClient();
		// Close connection to the database
		disconnectFromDatabase();
		// Close connection to cache server(s)
		disconnectFromRedisCache();
		//Close Http server
		server.close(() => {
			console.info("Http server closed");
		});
	});
}
