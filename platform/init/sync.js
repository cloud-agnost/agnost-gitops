import { io } from "socket.io-client";

var socket = null;

export function initializeSyncClient() {
	let syncConfig = config.get("sync");
	socket = io(`${helper.getSyncUrl()}/${syncConfig.namespace}`, {
		reconnection: syncConfig.reconnection,
		reconnectionDelay: syncConfig.reconnectionDelay,
		transports: ["websocket", "polling"],
		path: syncConfig.path,
	});

	socket.on("connect", () => {
		logger.info(
			`Connection established to synronization server @${helper.getSyncUrl()}`
		);
	});

	socket.io.on("reconnect", () => {
		logger.info(
			`Connection re-established to synronization server @${helper.getSyncUrl()}`
		);
	});
}

export function disconnectSyncClient() {
	socket.close();
}

export function sendMessage(channel, message) {
	socket.emit("channel:message", { channel: channel.toString(), message });
}
