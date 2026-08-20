import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware";
import { ApiError } from "../lib/ApiError";

export const requireVerified = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
	if (!req.user) {
		throw ApiError.unauthorized("Authentication required");
	}

	if (!req.user.isVerified) {
		throw ApiError.forbidden("Please verify your email address to perform this action", "EMAIL_NOT_VERIFIED");
	}

	next();
};
