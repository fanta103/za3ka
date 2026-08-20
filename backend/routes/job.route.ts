import express from "express";
import { protectRoute, requireRole } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import {
	createJob,
	deleteJob,
	getJobById,
	getJobs,
	updateJob,
	updateJobStatus,
} from "../controllers/job.controller";
import {
	createJobSchema,
	jobIdParamSchema,
	updateJobSchema,
	updateJobStatusSchema,
} from "../validations/job.validation";

const router = express.Router();

router.get("/", protectRoute, getJobs);
router.get("/:id", protectRoute, validateRequest({ params: jobIdParamSchema }), getJobById);
router.post(
	"/",
	protectRoute,
	requireRole("recruiter", "admin"),
	validateRequest({ body: createJobSchema }),
	createJob
);
router.put(
	"/:id",
	protectRoute,
	validateRequest({ params: jobIdParamSchema, body: updateJobSchema }),
	updateJob
);
router.patch(
	"/:id/status",
	protectRoute,
	validateRequest({ params: jobIdParamSchema, body: updateJobStatusSchema }),
	updateJobStatus
);
router.delete("/:id", protectRoute, validateRequest({ params: jobIdParamSchema }), deleteJob);

export default router;

