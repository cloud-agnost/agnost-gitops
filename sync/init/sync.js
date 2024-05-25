import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

export function setUpSyncServer(expressServer) {
	// Create the socket.io server
	const syncServer = new Server(expressServer, {
		serveClient: config.get("sync.serveClient"),
		// below are engine.IO options
		pingInterval: config.get("sync.pingInterval"),
		pingTimeout: config.get("sync.pingTimeout"),
		upgradeTimeout: config.get("sync.upgradeTimeout"),
		transports: ["websocket", "polling"],
		cors: {
			origin: "*",
		},
		path: config.get("sync.path"),
	});

	try {
		// Create the redis client for pub
		let cacheConfig = config.get("cache");
		const pubClient = createClient({
			host: process.env.CACHE_HOSTNAME,
			port: cacheConfig.port,
			password:
				process.env.CACHE_PWD && process.env.CACHE_PWD !== "null"
					? process.env.CACHE_PWD
					: undefined,
		});

		// Create the redis client for sub
		const subClient = pubClient.duplicate();

		pubClient.on("connect", function () {
			logger.info(
				`Connected to the cache server @${process.env.CACHE_HOSTNAME}:${cacheConfig.port}`
			);

			// Crate socket.io redis adapter
			syncServer.adapter(createAdapter(pubClient, subClient));
			logger.info("Synchronization server attached to Http server");

			syncServer.on("connect", (socket) => {
				logger.info(`Client ${socket.id} connected`);

				socket.on("disconnect", () => {
					logger.info(`Client ${socket.id} disconnected`);
				});

				// Joining the specificied channel
				socket.on("channel:join", (channel) => {
					logger.info(`Client ${socket.id} joined channel ${channel}`);
					socket.join(channel);
				});

				// Leaving the specificied channel
				socket.on("channel:leave", (channel) => {
					logger.info(`Client ${socket.id} left channel ${channel}`);
					socket.leave(channel);
				});

				// Sends a message to the specified channel members
				// The payload object with three parts, channel, event and the message itself
				// channel - the name of the channel to send the message to
				// message - the message contents, a json object
				// message.actor - The message initiator information (json object) provides user information
				// message.action - The event (e.g. action) type, e.g., create, update, delete
				// message.object - The object type e.g., user, organization, app, endpoint etc.
				// message.description - The Descriptive text about the action (e.g., created app 'my app')
				// message.timestamp - The datetime of the message
				// message.data - The body of the message (json object)
				socket.on("channel:message", (payload) => {
					socket.to(payload.channel).emit("notification", payload.message);
				});
			});
		});
	} catch (err) {
		logger.error(`Cannot connect to the sync cache server`, { details: err });
		process.exit(1);
	}

	return syncServer;
}
