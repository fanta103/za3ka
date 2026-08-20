import express from "express";
import {
	signup,
	login,
	logout,
	getCurrentUser,
	refreshToken,
	verifyEmail,
	resendVerificationEmail,
	forgotPassword,
	resetPassword,
} from "../controllers/auth.controller";
import { protectRoute } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import {
	signupSchema,
	loginSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	resendVerificationSchema,
	verifyTokenParamSchema,
} from "../validations/auth.validation";
import { authLimiter } from "../middleware/rateLimiter.middleware";

const router = express.Router();

router.post("/signup", authLimiter, validateRequest({ body: signupSchema }), signup);
router.post("/login", authLimiter, validateRequest({ body: loginSchema }), login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.get("/me", protectRoute, getCurrentUser);

router.get(
	"/verify-email/:token",
	validateRequest({ params: verifyTokenParamSchema }),
	verifyEmail
);
router.post(
	"/resend-verification",
	authLimiter,
	validateRequest({ body: resendVerificationSchema }),
	resendVerificationEmail
);

router.post(
	"/forgot-password",
	authLimiter,
	validateRequest({ body: forgotPasswordSchema }),
	forgotPassword
);
router.post(
	"/reset-password",
	authLimiter,
	validateRequest({ body: resetPasswordSchema }),
	resetPassword
);

export default router;
