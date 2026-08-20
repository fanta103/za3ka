import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user.model";

export interface AuthenticatedSocket extends Socket {
	user?: IUser;
	userId?: string;
}

export const socketAuthMiddleware = async (
	socket: AuthenticatedSocket,
	next: (err?: Error) => void
): Promise<void> => {
	try {
		// 1. Extract cookie from handshake headers or auth object
		const rawCookie = socket.handshake.headers.cookie;
		let token: string | undefined;

		if (rawCookie) {
			const match = rawCookie.match(/(?:^|;\s*)jwt-linkedin=([^;]+)/);
			if (match) {
				token = decodeURIComponent(match[1]);
			}
		}

		// Fallback to auth payload
		if (!token && socket.handshake.auth?.token) {
			token = socket.handshake.auth.token;
		}

		if (!token) {
			return next(new Error("Authentication error: No token provided"));
		}

		const secret = process.env.JWT_SECRET || "linkedin_clone_super_secret_jwt_key_2024";
		let decoded: { userId: string };

		try {
			decoded = jwt.verify(token, secret) as { userId: string };
		} catch (jwtErr: any) {
			return next(new Error("Authentication error: Invalid or expired token"));
		}

		if (!decoded || !decoded.userId) {
			return next(new Error("Authentication error: Invalid token payload"));
		}

		const user = await User.findById(decoded.userId).select("-password");
		if (!user) {
			return next(new Error("Authentication error: User not found"));
		}

		socket.user = user as IUser;
		socket.userId = user._id.toString();

		next();
	} catch (error: any) {
		next(new Error(`Authentication error: ${error.message || "Internal server error"}`));
	}
};
