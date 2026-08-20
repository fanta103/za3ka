import express from "express";
import { protectRoute } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import {
	scheduleInterview,
	getMyInterviews,
	getInterviewById,
	updateInterview,
	updateInterviewStatus,
	submitFeedback,
	generateInterviewToken,
} from "../controllers/interviewSession.controller";
import {
	interviewIdParamSchema,
	scheduleInterviewSchema,
	updateInterviewSchema,
	updateInterviewStatusSchema,
	feedbackSchema,
} from "../validations/interviewSession.validation";

const router = express.Router();

// Schedule a new interview (recruiter/admin only)
router.post(
	"/",
	protectRoute,
	requireRole("recruiter", "admin"),
	validateRequest({ body: scheduleInterviewSchema }),
	scheduleInterview
);

// Get my interviews (paginated, with optional status filter)
router.get("/my-interviews", protectRoute, getMyInterviews);

// Get a specific interview by ID (participants only)
router.get(
	"/:id",
	protectRoute,
	validateRequest({ params: interviewIdParamSchema }),
	getInterviewById
);

// Update interview status (participants only)
router.patch(
	"/:id/status",
	protectRoute,
	validateRequest({ params: interviewIdParamSchema, body: updateInterviewStatusSchema }),
	updateInterviewStatus
);

// Submit recruiter feedback (recruiter/admin only, completed interviews)
router.post(
	"/:id/feedback",
	protectRoute,
	requireRole("recruiter", "admin"),
	validateRequest({ params: interviewIdParamSchema, body: feedbackSchema }),
	submitFeedback
);

// Generate LiveKit room token (participants only)
router.post(
	"/:id/token",
	protectRoute,
	validateRequest({ params: interviewIdParamSchema }),
	generateInterviewToken
);

// Legacy full update (kept for backwards compat)
router.put(
	"/:id",
	protectRoute,
	validateRequest({ params: interviewIdParamSchema, body: updateInterviewSchema }),
	updateInterview
);

export default router;
