import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user.model";
import { ApiError } from "../lib/ApiError";

export interface AuthenticatedRequest extends Request {
	user?: IUser;
}

export const protectRoute = async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
	try {
		const token = req.cookies?.["jwt-linkedin"];

		if (!token) {
			throw ApiError.unauthorized("Unauthorized - No token provided", "NO_TOKEN");
		}

		const secret = process.env.JWT_SECRET || "linkedin_clone_super_secret_jwt_key_2024";

		let decoded: { userId: string };
		try {
			decoded = jwt.verify(token, secret) as { userId: string };
		} catch (jwtError: any) {
			if (jwtError.name === "TokenExpiredError") {
				throw ApiError.tokenExpired("Access token expired");
			}
			throw ApiError.unauthorized("Unauthorized - Invalid token", "INVALID_TOKEN");
		}

		if (!decoded || !decoded.userId) {
			throw ApiError.unauthorized("Unauthorized - Invalid token payload", "INVALID_TOKEN");
		}

		const user = await User.findById(decoded.userId).select("-password");

		if (!user) {
			throw ApiError.notFound("User not found", "USER_NOT_FOUND");
		}

		req.user = user as IUser;
		next();
	} catch (error) {
		next(error);
	}
};

export const requireRole = (...roles: string[]) => {
	return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
		try {
			if (!req.user) {
				throw ApiError.unauthorized("Authentication required");
			}
			if (!roles.includes(req.user.role)) {
				throw ApiError.forbidden(`Access denied: required role [${roles.join(", ")}]`);
			}
			next();
		} catch (error) {
			next(error);
		}
	};
};
