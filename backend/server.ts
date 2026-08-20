import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import express from "express";

import { app, server } from "./lib/socket";

import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import postRoutes from "./routes/post.route";
import notificationRoutes from "./routes/notification.route";
import connectionRoutes from "./routes/connection.route";
import jobRoutes from "./routes/job.route";
import applicationRoutes from "./routes/application.route";
import chatRoutes from "./routes/chat.route";
import interviewSessionRoutes from "./routes/interviewSession.route";
import searchRoutes from "./routes/search.route";

import { connectDB } from "./lib/db";
import { apiLimiter } from "./middleware/rateLimiter.middleware";
import { errorHandler } from "./middleware/errorHandler.middleware";
import { setupSwagger } from "./lib/swagger";

dotenv.config();

const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();


// Security headers with Helmet
app.use(
	helmet({
		crossOriginResourcePolicy: { policy: "cross-origin" },
	})
);

// CORS configuration
const allowedOrigins = [
	process.env.CLIENT_URL,
	"http://localhost:5173",
	"http://localhost:3000",
	"http://127.0.0.1:5173",
].filter(Boolean) as string[];

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error("Not allowed by CORS"));
			}
		},
		credentials: true,
	})
);

app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

// Setup Swagger API documentation
setupSwagger(app);

// Apply global rate limiting to all API endpoints
app.use("/api/v1", apiLimiter);

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/connections", connectionRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/applications", applicationRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/interviews", interviewSessionRoutes);
app.use("/api/v1/search", searchRoutes);

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "/frontend/dist")));

	app.get("*", (_req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
	});
}

// Global error handler middleware (must be registered last)
app.use(errorHandler);

// Connect to database before starting server
connectDB().then(() => {
	server.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
}).catch((error) => {
	console.error("Failed to start server:", error);
	process.exit(1);
});

export default app;

