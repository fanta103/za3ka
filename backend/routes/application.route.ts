import express from "express";
import { protectRoute } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import {
	applyToJob,
	getJobApplications,
	getMyApplications,
	updateApplicationStatus,
} from "../controllers/application.controller";
import {
	applicationIdParamSchema,
	applyJobSchema,
	jobApplicationsParamSchema,
	updateApplicationStatusSchema,
} from "../validations/application.validation";
import { uploadResume } from "../lib/multer";

const router = express.Router();

router.post(
	"/",
	protectRoute,
	uploadResume.single("resume"),
	validateRequest({ body: applyJobSchema }),
	applyToJob
);
router.get("/my-applications", protectRoute, getMyApplications);
router.get(
	"/job/:jobId",
	protectRoute,
	validateRequest({ params: jobApplicationsParamSchema }),
	getJobApplications
);
router.patch(
	"/:id/status",
	protectRoute,
	validateRequest({ params: applicationIdParamSchema, body: updateApplicationStatusSchema }),
	updateApplicationStatus
);
router.put(
	"/:id/status",
	protectRoute,
	validateRequest({ params: applicationIdParamSchema, body: updateApplicationStatusSchema }),
	updateApplicationStatus
);

export default router;

