import config from "config";
import { io } from "socket.io-client";
import helper from "../util/helper.js";

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
		console.info(
			`Connection established to synronization server @${helper.getSyncUrl()}`
		);
	});

	socket.io.on("reconnect", () => {
		console.info(
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
