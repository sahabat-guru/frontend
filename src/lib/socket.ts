"use client";

import { io, Socket } from "socket.io-client";

// In a real app, URL comes from env
const SOCKET_URL =
	process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8080";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
	if (!socket) {
		socket = io(SOCKET_URL, {
			autoConnect: false,
			transports: ["websocket"],
		});
	}
	return socket;
};
