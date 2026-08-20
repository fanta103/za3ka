import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import User, { IUser } from "../models/user.model";
import {
	sendWelcomeEmail,
	sendVerificationEmail,
	sendPasswordResetEmail,
} from "../emails/emailHandlers";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ApiError } from "../lib/ApiError";

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "linkedin_clone_super_secret_jwt_key_2024";
const ACCESS_TOKEN_EXPIRY = "15m";
const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Helper to set auth cookies and generate tokens
const generateAndSetAuthTokens = async (
	user: IUser,
	res: Response
): Promise<{ accessToken: string; refreshToken: string }> => {
	// 1. Generate 15m access token
	const accessToken = jwt.sign({ userId: user._id }, ACCESS_TOKEN_SECRET, {
		expiresIn: ACCESS_TOKEN_EXPIRY,
	});

	// 2. Generate cryptographically secure refresh token
	const rawRefreshToken = crypto.randomBytes(40).toString("hex");

	// 3. Hash refresh token before persisting in database
	const salt = await bcrypt.genSalt(10);
	user.refreshToken = await bcrypt.hash(rawRefreshToken, salt);
	await user.save();

	// 4. Set cookies
	const isProd = process.env.NODE_ENV === "production";

	res.cookie("jwt-linkedin", accessToken, {
		httpOnly: true,
		maxAge: ACCESS_TOKEN_MAX_AGE,
		sameSite: "strict",
		secure: isProd,
	});

	res.cookie("jwt-linkedin-refresh", rawRefreshToken, {
		httpOnly: true,
		maxAge: REFRESH_TOKEN_MAX_AGE,
		sameSite: "strict",
		secure: isProd,
		path: "/api/v1/auth", // only send to auth routes
	});

	return { accessToken, refreshToken: rawRefreshToken };
};

export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const { name, username, email, password, role } = req.body;

		const existingEmail = await User.findOne({ email });
		if (existingEmail) {
			throw ApiError.conflict("Email already exists", "EMAIL_EXISTS");
		}

		const existingUsername = await User.findOne({ username });
		if (existingUsername) {
			throw ApiError.conflict("Username already exists", "USERNAME_EXISTS");
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		// Generate verification token
		const rawVerifyToken = crypto.randomBytes(32).toString("hex");
		const hashedVerifyToken = crypto.createHash("sha256").update(rawVerifyToken).digest("hex");

		const user = new User({
			name,
			email,
			password: hashedPassword,
			username,
			role: role || "jobseeker",
			isVerified: false,
			verificationToken: hashedVerifyToken,
		});

		await user.save();

		await generateAndSetAuthTokens(user, res);

		const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
		const verifyUrl = `${clientUrl}/verify-email/${rawVerifyToken}`;
		const profileUrl = `${clientUrl}/profile/${user.username}`;

		// Send emails asynchronously (non-blocking)
		sendVerificationEmail(user.email, user.name, verifyUrl).catch((emailError) => {
			console.warn("Verification email sending failed (non-critical):", emailError);
		});
		sendWelcomeEmail(user.email, user.name, profileUrl).catch((emailError) => {
			console.warn("Welcome email sending failed (non-critical):", emailError);
		});

		res.status(201).json({
			success: true,
			message: "User registered successfully. Please verify your email.",
			user: {
				_id: user._id,
				name: user.name,
				username: user.username,
				email: user.email,
				role: user.role,
				isVerified: user.isVerified,
			},
		});
	} catch (error) {
		next(error);
	}
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const { username, password } = req.body;

		// Optimized lookup with lean() for faster query
		const user = await User.findOne({
			$or: [{ username }, { email: username }],
		}).lean();

		if (!user) {
			throw ApiError.badRequest("Invalid credentials", "INVALID_CREDENTIALS");
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			throw ApiError.badRequest("Invalid credentials", "INVALID_CREDENTIALS");
		}

		// Get full user document for token generation
		const fullUser = await User.findById(user._id);
		if (!fullUser) {
			throw ApiError.badRequest("Invalid credentials", "INVALID_CREDENTIALS");
		}

		await generateAndSetAuthTokens(fullUser, res);

		res.json({
			success: true,
			message: "Logged in successfully",
			user: {
				_id: fullUser._id,
				name: fullUser.name,
				username: fullUser.username,
				email: fullUser.email,
				role: fullUser.role,
				isVerified: fullUser.isVerified,
				profilePicture: fullUser.profilePicture,
			},
		});
	} catch (error) {
		next(error);
	}
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const rawRefreshToken = req.cookies?.["jwt-linkedin-refresh"];

		if (!rawRefreshToken) {
			throw ApiError.unauthorized("No refresh token provided", "NO_REFRESH_TOKEN");
		}

		// Find user with active refresh token (optimized with index)
		const users = await User.find({ refreshToken: { $exists: true, $ne: null } })
			.select("_id")
			.lean();
		let matchedUserId: Types.ObjectId | null = null;

		for (const u of users) {
			const user = await User.findById(u._id).select("refreshToken");
			if (user && user.refreshToken && (await bcrypt.compare(rawRefreshToken, user.refreshToken))) {
				matchedUserId = user._id;
				break;
			}
		}

		if (!matchedUserId) {
			// Clear invalid cookies
			res.clearCookie("jwt-linkedin");
			res.clearCookie("jwt-linkedin-refresh", { path: "/api/v1/auth" });
			throw ApiError.unauthorized("Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");
		}

		// Fetch full user document for token generation
		const matchedUser = await User.findById(matchedUserId);
		if (!matchedUser) {
			throw ApiError.notFound("User not found");
		}

		// Rotate token: generate new access & refresh tokens
		await generateAndSetAuthTokens(matchedUser, res);

		res.json({
			success: true,
			message: "Token refreshed successfully",
		});
	} catch (error) {
		next(error);
	}
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const rawRefreshToken = req.cookies?.["jwt-linkedin-refresh"];
		if (rawRefreshToken) {
			const users = await User.find({ refreshToken: { $exists: true, $ne: null } })
				.select("_id refreshToken")
				.lean();
			for (const u of users) {
				if (u.refreshToken && (await bcrypt.compare(rawRefreshToken, u.refreshToken))) {
					await User.findByIdAndUpdate(u._id, { $unset: { refreshToken: "" } });
					break;
				}
			}
		}

		res.clearCookie("jwt-linkedin");
		res.clearCookie("jwt-linkedin-refresh", { path: "/api/v1/auth" });

		res.json({ success: true, message: "Logged out successfully" });
	} catch (error) {
		next(error);
	}
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Not authenticated");
		}
		res.json(req.user);
	} catch (error) {
		next(error);
	}
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const { token } = req.params;
		const hashedToken = crypto.createHash("sha256").update(token as string).digest("hex");

		const user = await User.findOne({ verificationToken: hashedToken });
		if (!user) {
			throw ApiError.badRequest("Invalid or expired email verification token", "INVALID_VERIFICATION_TOKEN");
		}

		user.isVerified = true;
		user.verificationToken = undefined;
		await user.save();

		res.json({ success: true, message: "Email verified successfully" });
	} catch (error) {
		next(error);
	}
};

export const resendVerificationEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const { email } = req.body;
		const user = await User.findOne({ email });

		if (!user) {
			// Return success to avoid email enumeration
			res.json({ success: true, message: "If an account exists with this email, a verification link has been sent." });
			return;
		}

		if (user.isVerified) {
			res.json({ success: true, message: "Email is already verified." });
			return;
		}

		const rawVerifyToken = crypto.randomBytes(32).toString("hex");
		user.verificationToken = crypto.createHash("sha256").update(rawVerifyToken).digest("hex");
		await user.save();

		const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
		const verifyUrl = `${clientUrl}/verify-email/${rawVerifyToken}`;

		await sendVerificationEmail(user.email, user.name, verifyUrl);

		res.json({ success: true, message: "Verification email resent successfully." });
	} catch (error) {
		next(error);
	}
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const { email } = req.body;
		const user = await User.findOne({ email });

		if (!user) {
			// Do not leak whether user exists
			res.json({ success: true, message: "If that email is registered, password reset instructions have been sent." });
			return;
		}

		const rawResetToken = crypto.randomBytes(32).toString("hex");
		user.resetPasswordToken = crypto.createHash("sha256").update(rawResetToken).digest("hex");
		user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
		await user.save();

		const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
		const resetUrl = `${clientUrl}/reset-password/${rawResetToken}`;

		await sendPasswordResetEmail(user.email, user.name, resetUrl);

		res.json({ success: true, message: "If that email is registered, password reset instructions have been sent." });
	} catch (error) {
		next(error);
	}
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const { token, password } = req.body;
		const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

		const user = await User.findOne({
			resetPasswordToken: hashedToken,
			resetPasswordExpires: { $gt: new Date() },
		});

		if (!user) {
			throw ApiError.badRequest("Invalid or expired password reset token", "INVALID_RESET_TOKEN");
		}

		const salt = await bcrypt.genSalt(10);
		user.password = await bcrypt.hash(password, salt);
		user.resetPasswordToken = undefined;
		user.resetPasswordExpires = undefined;
		user.refreshToken = undefined; // invalidate existing refresh tokens

		await user.save();

		res.json({ success: true, message: "Password has been successfully reset. Please log in with your new password." });
	} catch (error) {
		next(error);
	}
};
