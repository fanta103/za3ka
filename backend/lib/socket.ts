import http from "http";
import express from "express";
import { Server } from "socket.io";
import { socketAuthMiddleware, AuthenticatedSocket } from "../middleware/socketAuth.middleware";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
	process.env.CLIENT_URL,
	"http://localhost:5173",
	"http://localhost:3000",
	"http://127.0.0.1:5173",
].filter(Boolean) as string[];

const io = new Server(server, {
	cors: {
		origin: (origin, callback) => {
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(null, true);
			}
		},
		credentials: true,
	},
});

// In-memory mapping of userId to socket.id
const userSocketMap: Record<string, string> = {};

export const getReceiverSocketId = (userId: string): string | undefined => {
	return userSocketMap[userId];
};

// Apply auth middleware to all socket connections
io.use(socketAuthMiddleware as any);

io.on("connection", (socket: AuthenticatedSocket) => {
	const userId = socket.userId;

	if (userId) {
		userSocketMap[userId] = socket.id;
		console.log(`[Socket] User connected: ${userId} (Socket ID: ${socket.id})`);
		// Broadcast current online users array
		io.emit("getOnlineUsers", Object.keys(userSocketMap));
	}

	socket.on("disconnect", () => {
		if (userId) {
			console.log(`[Socket] User disconnected: ${userId} (Socket ID: ${socket.id})`);
			delete userSocketMap[userId];
			// Broadcast updated online users array
			io.emit("getOnlineUsers", Object.keys(userSocketMap));
		}
	});
});

export { app, server, io, userSocketMap };
