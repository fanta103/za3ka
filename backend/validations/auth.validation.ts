import { z } from "zod";

export const signupSchema = z.object({
	name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
	username: z
		.string()
		.min(3, "Username must be at least 3 characters")
		.max(30, "Username cannot exceed 30 characters")
		.regex(/^[a-zA-Z0-9_]+$/, "Username can only contain alphanumeric characters and underscores"),
	email: z.string().email("Invalid email address"),
	password: z.string().min(6, "Password must be at least 6 characters"),
	role: z.enum(["jobseeker", "recruiter", "admin"]).optional().default("jobseeker"),
});

export const loginSchema = z.object({
	username: z.string().min(1, "Username is required"),
	password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
	email: z.string().email("Valid email address is required"),
});

export const resetPasswordSchema = z.object({
	token: z.string().min(1, "Reset token is required"),
	password: z.string().min(6, "Password must be at least 6 characters"),
});

export const verifyTokenParamSchema = z.object({
	token: z.string().min(1, "Verification token is required"),
});

export const resendVerificationSchema = z.object({
	email: z.string().email("Valid email address is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
