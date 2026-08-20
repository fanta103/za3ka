import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthUser } from "../hooks/useAuth";

interface SocketContextType {
	socket: Socket | null;
	onlineUsers: string[];
	isOnline: (userId?: string) => boolean;
}

const SocketContext = createContext<SocketContextType>({
	socket: null,
	onlineUsers: [],
	isOnline: () => false,
});

export const useSocket = () => useContext(SocketContext);

const SOCKET_URL =
	import.meta.env.MODE === "development"
		? "http://localhost:5000"
		: window.location.origin;

export const SocketContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
	const { data: authUser } = useAuthUser();

	useEffect(() => {
		if (authUser) {
			const socketInstance = io(SOCKET_URL, {
				withCredentials: true,
				transports: ["websocket", "polling"],
			});

			setSocket(socketInstance);

			socketInstance.on("getOnlineUsers", (users: string[]) => {
				setOnlineUsers(users);
			});

			socketInstance.on("connect_error", (err) => {
				console.warn("[Socket connection error]:", err.message);
			});

			return () => {
				socketInstance.disconnect();
				setSocket(null);
			};
		} else {
			if (socket) {
				socket.disconnect();
				setSocket(null);
			}
			setOnlineUsers([]);
		}
	// Query refetches can replace the user object. Reconnecting for that causes
	// dropped presence updates and unnecessary websocket handshakes.
	}, [authUser?._id]);

	const isOnline = (userId?: string): boolean => {
		if (!userId) return false;
		return onlineUsers.includes(userId);
	};

	return (
		<SocketContext.Provider value={{ socket, onlineUsers, isOnline }}>
			{children}
		</SocketContext.Provider>
	);
};
