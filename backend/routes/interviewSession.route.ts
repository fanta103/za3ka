import express from "express";
import { protectRoute } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import {
	getInterviewById,
	getMyInterviews,
	scheduleInterview,
	updateInterview,
} from "../controllers/interviewSession.controller";
import {
	interviewIdParamSchema,
	scheduleInterviewSchema,
	updateInterviewSchema,
} from "../validations/interviewSession.validation";

const router = express.Router();

router.post("/", protectRoute, validateRequest({ body: scheduleInterviewSchema }), scheduleInterview);
router.get("/my-interviews", protectRoute, getMyInterviews);
router.get("/:id", protectRoute, validateRequest({ params: interviewIdParamSchema }), getInterviewById);
router.put(
	"/:id",
	protectRoute,
	validateRequest({ params: interviewIdParamSchema, body: updateInterviewSchema }),
	updateInterview
);

export default router;
