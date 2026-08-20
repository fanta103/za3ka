export class ApiError extends Error {
	public statusCode: number;
	public code: string;
	public errors?: any[];

	constructor(statusCode: number, message: string, code: string = "INTERNAL_SERVER_ERROR", errors?: any[]) {
		super(message);
		this.statusCode = statusCode;
		this.code = code;
		this.errors = errors;
		Object.setPrototypeOf(this, ApiError.prototype);
	}

	static badRequest(message: string, code: string = "BAD_REQUEST", errors?: any[]): ApiError {
		return new ApiError(400, message, code, errors);
	}

	static unauthorized(message: string, code: string = "UNAUTHORIZED"): ApiError {
		return new ApiError(401, message, code);
	}

	static tokenExpired(message: string = "Access token expired"): ApiError {
		return new ApiError(401, message, "TOKEN_EXPIRED");
	}

	static forbidden(message: string, code: string = "FORBIDDEN"): ApiError {
		return new ApiError(403, message, code);
	}

	static notFound(message: string, code: string = "NOT_FOUND"): ApiError {
		return new ApiError(404, message, code);
	}

	static conflict(message: string, code: string = "CONFLICT"): ApiError {
		return new ApiError(409, message, code);
	}

	static internal(message: string = "Internal server error"): ApiError {
		return new ApiError(500, message, "INTERNAL_SERVER_ERROR");
	}
}
