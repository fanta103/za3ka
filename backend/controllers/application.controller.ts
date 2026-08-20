import { Response, NextFunction } from "express";
import Application from "../models/application.model";
import Job from "../models/job.model";
import User from "../models/user.model";
import Notification from "../models/notification.model";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ApiError } from "../lib/ApiError";
import { formatPaginatedResult, getPaginationParams } from "../lib/pagination";
import { uploadDocumentToCloudinary } from "../lib/multer";
import { sendApplicationStatusEmail, sendJobApplicationEmail } from "../emails/emailHandlers";

/**
 * @swagger
 * /applications:
 *   post:
 *     summary: Submit a job application (jobseekers only)
 *     tags: [Applications]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *             properties:
 *               jobId:
 *                 type: string
 *               coverLetter:
 *                 type: string
 *               resume:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *       400:
 *         description: Job is closed or validation error
 *       409:
 *         description: Already applied to this job
 */
export const applyToJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		if (req.user.role === "recruiter") {
			throw ApiError.forbidden("Recruiter accounts cannot submit job applications");
		}

		const { jobId, coverLetter } = req.body;
		let resumeUrl = req.body.resumeUrl || "";

		const job = await Job.findOne({ _id: jobId, deletedAt: null }).populate("authorId", "name username email");
		if (!job) {
			throw ApiError.notFound("Job listing not found");
		}

		if (job.status !== "open") {
			throw ApiError.badRequest("This job is no longer accepting applications");
		}

		const existingApp = await Application.findOne({ jobId, applicantId: req.user._id });
		if (existingApp) {
			throw ApiError.conflict("You have already applied to this job", "ALREADY_APPLIED");
		}

		// Handle file upload if present
		if (req.file) {
			try {
				const uploadRes = await uploadDocumentToCloudinary(req.file.buffer, "linkedin_resumes");
				resumeUrl = uploadRes.secure_url;
			} catch (uploadError: any) {
				console.warn("Cloudinary resume upload failed:", uploadError.message);
			}
		}

		const application = new Application({
			jobId,
			applicantId: req.user._id,
			recruiterId: typeof job.authorId === "object" ? job.authorId._id : job.authorId,
			coverLetter,
			resumeUrl,
			status: "applied",
		});

		try {
			await application.save();
		} catch (dbError: any) {
			if (dbError.code === 11000) {
				throw ApiError.conflict("You have already applied to this job", "ALREADY_APPLIED");
			}
			throw dbError;
		}

		// Increment job applicant count
		await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });

		// Send notification to the recruiter
		try {
			const recruiterId = typeof job.authorId === "object" ? job.authorId._id : job.authorId;
			await Notification.create({
				recipient: recruiterId,
				type: "jobApplication",
				relatedUser: req.user._id,
				relatedJob: job._id,
			});

			const recruiterUser = typeof job.authorId === "object" ? (job.authorId as any) : await User.findById(recruiterId);
			if (recruiterUser && recruiterUser.email) {
				const jobUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/my-jobs`;
				sendJobApplicationEmail(
					recruiterUser.email,
					recruiterUser.name,
					req.user.name,
					job.title,
					jobUrl
				).catch((err) => console.warn("Failed to send application email:", err.message));
			}
		} catch (notifErr: any) {
			console.warn("Could not create notification for recruiter:", notifErr.message);
		}

		const populated = await application.populate([
			{ path: "jobId", select: "title company location type salaryMin salaryMax status" },
			{ path: "recruiterId", select: "name username profilePicture headline" },
		]);

		res.status(201).json(populated);
	} catch (error) {
		next(error);
	}
};

/**
 * @swagger
 * /applications/my-applications:
 *   get:
 *     summary: Get paginated list of current user's job applications
 *     tags: [Applications]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User's applications
 */
export const getMyApplications = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const { cursor, limit } = getPaginationParams(req);
		const query: Record<string, any> = { applicantId: req.user._id };

		if (cursor) {
			query.createdAt = { $lt: new Date(cursor) };
		}

		const applications = await Application.find(query)
			.populate("jobId", "title company location type salaryMin salaryMax status deletedAt")
			.populate("recruiterId", "name username profilePicture headline")
			.sort({ createdAt: -1 })
			.limit(limit + 1);

		const result = formatPaginatedResult(applications, limit);
		res.json(result);
	} catch (error) {
		next(error);
	}
};

/**
 * @swagger
 * /applications/job/{jobId}:
 *   get:
 *     summary: Get all applicants for a specific job (recruiter/author only)
 *     tags: [Applications]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of applications for job
 *       403:
 *         description: Forbidden - Not author of job
 *       404:
 *         description: Job not found
 */
export const getJobApplications = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const { jobId } = req.params;
		const job = await Job.findById(jobId);
		if (!job) {
			throw ApiError.notFound("Job not found");
		}

		if (job.authorId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
			throw ApiError.forbidden("Forbidden - Only the job author can view applications");
		}

		const { cursor, limit } = getPaginationParams(req);
		const query: Record<string, any> = { jobId };

		if (cursor) {
			query.createdAt = { $lt: new Date(cursor) };
		}

		const applications = await Application.find(query)
			.populate(
				"applicantId",
				"name username email profilePicture headline location skills experience education"
			)
			.sort({ createdAt: -1 })
			.limit(limit + 1);

		const result = formatPaginatedResult(applications, limit);
		res.json(result);
	} catch (error) {
		next(error);
	}
};

/**
 * @swagger
 * /applications/{id}/status:
 *   patch:
 *     summary: Update status of an application (recruiter only)
 *     tags: [Applications]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [applied, screening, interview, offered, rejected, withdrawn]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application status updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Application not found
 */
export const updateApplicationStatus = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const { status, notes } = req.body;
		const application = await Application.findById(req.params.id)
			.populate("jobId", "title company")
			.populate("applicantId", "name username email");

		if (!application) {
			throw ApiError.notFound("Application not found");
		}

		if (application.recruiterId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
			throw ApiError.forbidden("Forbidden - Not recruiter for this job");
		}

		// Validate job status - prevent updates for closed/paused jobs
		const job = await Job.findById(application.jobId);
		if (job && job.status !== "open") {
			throw ApiError.badRequest(`Cannot update application status for ${job.status} jobs`);
		}

		const oldStatus = application.status;
		if (status) application.status = status;
		if (notes !== undefined) application.notes = notes;

		await application.save();

		// Notify applicant on status change
		if (status && status !== oldStatus) {
			try {
				const applicantId =
					typeof application.applicantId === "object"
						? (application.applicantId as any)._id
						: application.applicantId;

				await Notification.create({
					recipient: applicantId,
					type: "applicationStatus",
					relatedUser: req.user._id,
					relatedJob: (application.jobId as any)?._id || application.jobId,
				});

				const applicantUser = application.applicantId as any;
				const jobInfo = application.jobId as any;
				if (applicantUser && applicantUser.email) {
					const portalUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/my-applications`;
					sendApplicationStatusEmail(
						applicantUser.email,
						applicantUser.name,
						jobInfo?.title || "Job Application",
						jobInfo?.company || "Company",
						status,
						portalUrl
					).catch((err) => console.warn("Failed to send status update email:", err.message));
				}
			} catch (notifErr: any) {
				console.warn("Could not create status notification for applicant:", notifErr.message);
			}
		}

		res.json(application);
	} catch (error) {
		next(error);
	}
};

