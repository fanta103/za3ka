import { Response, NextFunction } from "express";
import Job from "../models/job.model";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ApiError } from "../lib/ApiError";
import { formatPaginatedResult, getPaginationParams } from "../lib/pagination";

/**
 * @swagger
 * /jobs:
 *   post:
 *     summary: Create a new job listing (recruiter only)
 *     tags: [Jobs]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateJobInput'
 *     responses:
 *       201:
 *         description: Job created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Recruiters only
 */
export const createJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		if (req.user.role !== "recruiter" && req.user.role !== "admin") {
			throw ApiError.forbidden("Only recruiters can create job listings");
		}

		const job = new Job({
			...req.body,
			authorId: req.user._id,
			viewsCount: 0,
			applicantsCount: 0,
			deletedAt: null,
		});

		await job.save();
		const populated = await job.populate("authorId", "name username profilePicture headline location");

		res.status(201).json(populated);
	} catch (error) {
		next(error);
	}
};

/**
 * @swagger
 * /jobs:
 *   get:
 *     summary: Get paginated job listings with filters
 *     tags: [Jobs]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [full-time, part-time, contract, internship, remote]
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           default: open
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
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
 *         description: Paginated job listings
 */
export const getJobs = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		const { status, type, location, search, authorId } = req.query;
		const { cursor, limit } = getPaginationParams(req);
		const query: Record<string, any> = { deletedAt: null };

		if (status) {
			query.status = status;
		} else {
			query.status = "open";
		}

		if (type) {
			query.type = type;
		}

		if (location && String(location).trim()) {
			query.location = new RegExp(String(location).trim(), "i");
		}

		if (authorId) {
			query.authorId = authorId;
		}

		if (search && String(search).trim()) {
			const searchRegex = new RegExp(String(search).trim(), "i");
			query.$or = [
				{ title: searchRegex },
				{ company: searchRegex },
				{ description: searchRegex },
				{ location: searchRegex },
			];
		}

		if (cursor) {
			query.createdAt = { $lt: new Date(cursor) };
		}

		const jobs = await Job.find(query)
			.populate("authorId", "name username profilePicture headline location")
			.sort({ createdAt: -1 })
			.limit(limit + 1);

		const result = formatPaginatedResult(jobs, limit);
		res.json(result);
	} catch (error) {
		next(error);
	}
};

/**
 * @swagger
 * /jobs/{id}:
 *   get:
 *     summary: Get single job by ID (increments viewsCount)
 *     tags: [Jobs]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job details
 *       404:
 *         description: Job not found
 */
export const getJobById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		const job = await Job.findOneAndUpdate(
			{ _id: req.params.id, deletedAt: null },
			{ $inc: { viewsCount: 1 } },
			{ new: true }
		).populate("authorId", "name username profilePicture headline location about");

		if (!job) {
			throw ApiError.notFound("Job not found");
		}

		res.json(job);
	} catch (error) {
		next(error);
	}
};

/**
 * @swagger
 * /jobs/{id}:
 *   put:
 *     summary: Update job details (author only)
 *     tags: [Jobs]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Job not found
 */
export const updateJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const job = await Job.findOne({ _id: req.params.id, deletedAt: null });
		if (!job) {
			throw ApiError.notFound("Job not found");
		}

		if (job.authorId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
			throw ApiError.forbidden("Forbidden - Not author of this job");
		}

		Object.assign(job, req.body);
		await job.save();

		const populated = await job.populate("authorId", "name username profilePicture headline location");
		res.json(populated);
	} catch (error) {
		next(error);
	}
};

/**
 * @swagger
 * /jobs/{id}/status:
 *   patch:
 *     summary: Update job status (open, closed, paused - author only)
 *     tags: [Jobs]
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
 *                 enum: [open, closed, paused]
 *     responses:
 *       200:
 *         description: Job status updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Job not found
 */
export const updateJobStatus = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const { status } = req.body;
		const job = await Job.findOne({ _id: req.params.id, deletedAt: null });

		if (!job) {
			throw ApiError.notFound("Job not found");
		}

		if (job.authorId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
			throw ApiError.forbidden("Forbidden - Not author of this job");
		}

		job.status = status;
		await job.save();

		const populated = await job.populate("authorId", "name username profilePicture headline location");
		res.json(populated);
	} catch (error) {
		next(error);
	}
};

/**
 * @swagger
 * /jobs/{id}:
 *   delete:
 *     summary: Soft delete a job listing (author only)
 *     tags: [Jobs]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Job not found
 */
export const deleteJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const job = await Job.findOne({ _id: req.params.id, deletedAt: null });
		if (!job) {
			throw ApiError.notFound("Job not found");
		}

		if (job.authorId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
			throw ApiError.forbidden("Forbidden - Not author of this job");
		}

		job.status = "closed";
		await job.softDelete();

		res.json({ success: true, message: "Job deleted successfully" });
	} catch (error) {
		next(error);
	}
};

