import { io } from "socket.io-client";

export const socket = io(window.location.hostname, {
  reconnection: true,
  reconnectionDelay: 500,
  transports: ["websocket", "polling"],
  path: "/sync/sync/",
});

socket.on("connect", () => {});

socket.on("connect_error", (error) => {
  console.error("Not Connected to socket.io server", error);
});
