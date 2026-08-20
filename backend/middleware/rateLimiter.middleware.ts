import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV !== "production";

// Global API rate limiter
export const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: isDev ? 10000 : 200, // Generous in development so testing isn't blocked
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		message: "Too many requests from this IP, please try again after 15 minutes.",
	},
});

// Stricter rate limiter for authentication routes (login / signup)
export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: isDev ? 1000 : 15, // Generous in development, strict in production
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		message: "Too many authentication attempts, please try again after 15 minutes.",
	},
});
