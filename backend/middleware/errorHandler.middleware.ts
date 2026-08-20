import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../lib/ApiError";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
	console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

	// 1. ApiError
	if (err instanceof ApiError) {
		res.status(err.statusCode).json({
			success: false,
			message: err.message,
			error: {
				message: err.message,
				code: err.code,
				statusCode: err.statusCode,
				errors: err.errors,
			},
		});
		return;
	}

	// 2. Zod validation error
	if (err instanceof ZodError || err?.issues) {
		const issues = err.issues || err.errors || [];
		const errors = issues.map((issue: any) => ({
			field: Array.isArray(issue.path) ? issue.path.join(".") : String(issue.path),
			message: issue.message,
		}));
		const firstMessage = errors[0]?.message || "Validation error";

		res.status(400).json({
			success: false,
			message: firstMessage,
			error: {
				message: firstMessage,
				code: "VALIDATION_ERROR",
				statusCode: 400,
				errors,
			},
		});
		return;
	}

	// 3. Mongoose Validation Error
	if (err.name === "ValidationError") {
		const errors = Object.values(err.errors || {}).map((e: any) => ({
			field: e.path,
			message: e.message,
		}));
		res.status(400).json({
			success: false,
			message: err.message || "Database validation failed",
			error: {
				message: err.message || "Database validation failed",
				code: "VALIDATION_ERROR",
				statusCode: 400,
				errors,
			},
		});
		return;
	}

	// 4. Mongoose CastError (invalid ObjectId)
	if (err.name === "CastError") {
		res.status(400).json({
			success: false,
			message: `Invalid ${err.path}: ${err.value}`,
			error: {
				message: `Invalid ${err.path}: ${err.value}`,
				code: "INVALID_ID",
				statusCode: 400,
			},
		});
		return;
	}

	// 5. JWT Errors
	if (err.name === "TokenExpiredError") {
		res.status(401).json({
			success: false,
			message: "Access token expired",
			error: {
				message: "Access token expired",
				code: "TOKEN_EXPIRED",
				statusCode: 401,
			},
		});
		return;
	}

	if (err.name === "JsonWebTokenError") {
		res.status(401).json({
			success: false,
			message: "Invalid token",
			error: {
				message: "Invalid token",
				code: "INVALID_TOKEN",
				statusCode: 401,
			},
		});
		return;
	}

	// 6. Generic unhandled internal error
	res.status(500).json({
		success: false,
		message: "Internal server error",
		error: {
			message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message || "Internal server error",
			code: "INTERNAL_SERVER_ERROR",
			statusCode: 500,
		},
	});
};
