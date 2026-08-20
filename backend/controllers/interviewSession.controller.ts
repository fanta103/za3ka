import { Response, NextFunction } from "express";
import InterviewSession from "../models/interviewSession.model";
import Job from "../models/job.model";
import Notification from "../models/notification.model";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ApiError } from "../lib/ApiError";
import { getPaginationParams, formatPaginatedResult } from "../lib/pagination";
import { generateRoomToken, ensureRoom, LIVEKIT_URL } from "../lib/livekit";

/**
 * @swagger
 * /interviews:
 *   post:
 *     summary: Schedule a video interview (recruiter only)
 *     tags: [Interviews]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *               - candidateId
 *               - scheduledAt
 *             properties:
 *               jobId:
 *                 type: string
 *               candidateId:
 *                 type: string
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               duration:
 *                 type: integer
 *                 default: 30
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Interview scheduled
 *       403:
 *         description: Forbidden — not the job recruiter
 *       404:
 *         description: Job not found
 */
export const scheduleInterview = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) throw ApiError.unauthorized("Authentication required");

		const { jobId, candidateId, scheduledAt, duration, note } = req.body;
		const recruiterId = req.user._id;

		// Validate the job exists and user is the author
		const job = await Job.findById(jobId);
		if (!job) throw ApiError.notFound("Job not found");

		if (
			job.authorId.toString() !== recruiterId.toString() &&
			req.user.role !== "admin"
		) {
			throw ApiError.forbidden("Only the recruiter who posted this job can schedule interviews");
		}

		// Ensure candidate is not the same as recruiter
		if (candidateId === recruiterId.toString()) {
			throw ApiError.badRequest("Cannot schedule interview with yourself");
		}

		const liveKitRoomName = `interview-${jobId}-${candidateId}-${Date.now()}`;

		const interview = new InterviewSession({
			jobId,
			candidateId,
			recruiterId,
			scheduledAt: new Date(scheduledAt),
			duration: duration || 30,
			note: note || undefined,
			liveKitRoomName,
			status: "scheduled",
		});

		await interview.save();

		const populated = await interview.populate([
			{ path: "jobId", select: "title company location" },
			{ path: "candidateId", select: "name username profilePicture headline email" },
			{ path: "recruiterId", select: "name username profilePicture headline email" },
		]);

		// Notify candidate
		await Notification.create({
			recipient: candidateId,
			type: "interviewScheduled",
			relatedUser: recruiterId,
			relatedInterview: interview._id,
		});

		res.status(201).json(populated);
	} catch (error) {
		next(error);
	}
};

/**
 * @swagger
 * /interviews/my-interviews:
 *   get:
 *     summary: Get paginated list of my interviews (as candidate or recruiter)
 *     tags: [Interviews]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, in-progress, completed, cancelled]
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
 *         description: Paginated interview list
 */
export const getMyInterviews = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) throw ApiError.unauthorized("Authentication required");

		const myId = req.user._id;
		const { status } = req.query;
		const { limit, cursor } = getPaginationParams(req);

		const query: Record<string, any> = {
			$or: [{ candidateId: myId }, { recruiterId: myId }],
		};

		if (status && typeof status === "string") {
			query.status = status;
		}

		if (cursor) {
			query.scheduledAt = { $gt: new Date(cursor) };
		}

		const interviews = await InterviewSession.find(query)
			.populate("jobId", "title company location")
			.populate("candidateId", "name username profilePicture headline")
			.populate("recruiterId", "name username profilePicture headline")
			.sort({ scheduledAt: 1 })
			.limit(limit + 1);

		const result = formatPaginatedResult(interviews, limit, "scheduledAt");

		res.json(result);
	} catch (error) {
		next(error);
	}
};

/**
 * @swagger
 * /interviews/{id}:
 *   get:
 *     summary: Get a single interview session by ID
 *     tags: [Interviews]
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
 *         description: Interview session details
 *       403:
 *         description: Forbidden — not a participant
 *       404:
 *         description: Not found
 */
export const getInterviewById = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) throw ApiError.unauthorized("Authentication required");

		const interview = await InterviewSession.findById(req.params.id)
			.populate("jobId", "title company location description requirements")
			.populate("candidateId", "name username profilePicture headline email skills experience education")
			.populate("recruiterId", "name username profilePicture headline email");

		if (!interview) throw ApiError.notFound("Interview session not found");

		const isParticipant =
			(interview.candidateId as any)._id?.toString() === req.user._id.toString() ||
			(interview.recruiterId as any)._id?.toString() === req.user._id.toString() ||
			req.user.role === "admin";

		if (!isParticipant) {
			throw ApiError.forbidden("You are not a participant in this interview");
		}

		res.json(interview);
	} catch (error) {
		next(error);
	}
};

/**
 * @swagger
 * /interviews/{id}/status:
 *   patch:
 *     summary: Update interview status (participants only)
 *     tags: [Interviews]
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
 *                 enum: [scheduled, in-progress, completed, cancelled]
 *     responses:
 *       200:
 *         description: Status updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
export const updateInterviewStatus = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) throw ApiError.unauthorized("Authentication required");

		const { status } = req.body;
		const myId = req.user._id.toString();

		const interview = await InterviewSession.findById(req.params.id);
		if (!interview) throw ApiError.notFound("Interview session not found");

		const candidateIdStr = interview.candidateId.toString();
		const recruiterIdStr = interview.recruiterId.toString();
		const isParticipant =
			candidateIdStr === myId || recruiterIdStr === myId || req.user.role === "admin";

		if (!isParticipant) {
			throw ApiError.forbidden("You are not a participant in this interview");
		}

		interview.status = status;
		await interview.save();

		// Notify the OTHER participant
		const otherParticipantId = myId === recruiterIdStr ? candidateIdStr : recruiterIdStr;
		await Notification.create({
			recipient: otherParticipantId,
			type: "interviewStatusChanged",
			relatedUser: req.user._id,
			relatedInterview: interview._id,
		});

		const populated = await interview.populate([
			{ path: "jobId", select: "title company location" },
			{ path: "candidateId", select: "name username profilePicture headline" },
			{ path: "recruiterId", select: "name username profilePicture headline" },
		]);

		res.json(populated);
	} catch (error) {
		next(error);
	}
};

/**
 * @swagger
 * /interviews/{id}/feedback:
 *   post:
 *     summary: Recruiter submits post-interview feedback (recruiter only, completed interviews)
 *     tags: [Interviews]
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
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feedback submitted
 *       403:
 *         description: Forbidden — must be the recruiter, interview must be completed
 *       404:
 *         description: Not found
 */
export const submitFeedback = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) throw ApiError.unauthorized("Authentication required");

		const { rating, notes } = req.body;
		const myId = req.user._id.toString();

		const interview = await InterviewSession.findById(req.params.id);
		if (!interview) throw ApiError.notFound("Interview session not found");

		if (interview.recruiterId.toString() !== myId && req.user.role !== "admin") {
			throw ApiError.forbidden("Only the recruiter can submit feedback");
		}

		if (interview.status !== "completed") {
			throw ApiError.badRequest("Feedback can only be submitted for completed interviews");
		}

		interview.recruiterFeedback = { rating, notes };
		await interview.save();

		// Notify the candidate about the feedback
		await Notification.create({
			recipient: interview.candidateId,
			type: "interviewFeedback",
			relatedUser: req.user._id,
			relatedInterview: interview._id,
		});

		const populated = await interview.populate([
			{ path: "jobId", select: "title company location" },
			{ path: "candidateId", select: "name username profilePicture headline" },
			{ path: "recruiterId", select: "name username profilePicture headline" },
		]);

		res.json(populated);
	} catch (error) {
		next(error);
	}
};

/**
 * @swagger
 * /interviews/{id}/token:
 *   post:
 *     summary: Generate a LiveKit room token for the current participant
 *     tags: [Interviews]
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
 *         description: LiveKit token and server URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 url:
 *                   type: string
 *       403:
 *         description: Forbidden — not a participant
 *       404:
 *         description: Interview not found
 */
export const generateInterviewToken = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) throw ApiError.unauthorized("Authentication required");

		const myId = req.user._id.toString();

		const interview = await InterviewSession.findById(req.params.id)
			.populate("candidateId", "name username")
			.populate("recruiterId", "name username");

		if (!interview) throw ApiError.notFound("Interview session not found");

		const candidateIdStr = (interview.candidateId as any)._id?.toString() || interview.candidateId.toString();
		const recruiterIdStr = (interview.recruiterId as any)._id?.toString() || interview.recruiterId.toString();

		const isParticipant =
			candidateIdStr === myId || recruiterIdStr === myId || req.user.role === "admin";

		if (!isParticipant) {
			throw ApiError.forbidden("You are not a participant in this interview");
		}

		if (!interview.liveKitRoomName) {
			throw ApiError.badRequest("This interview does not have a room configured");
		}

		if (interview.status === "cancelled") {
			throw ApiError.badRequest("Cannot join a cancelled interview");
		}

		// Ensure the room exists on LiveKit servers
		await ensureRoom(interview.liveKitRoomName);

		const token = await generateRoomToken({
			roomName: interview.liveKitRoomName,
			participantIdentity: myId,
			participantName: req.user.name,
		});

		res.json({ token, url: LIVEKIT_URL });
	} catch (error) {
		next(error);
	}
};

// Legacy handler kept for backward compatibility
export const updateInterview = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) throw ApiError.unauthorized("Authentication required");

		const interview = await InterviewSession.findById(req.params.id);
		if (!interview) throw ApiError.notFound("Interview session not found");

		const isParticipant =
			interview.candidateId.toString() === req.user._id.toString() ||
			interview.recruiterId.toString() === req.user._id.toString() ||
			req.user.role === "admin";

		if (!isParticipant) throw ApiError.forbidden("Forbidden");

		Object.assign(interview, req.body);
		await interview.save();

		res.json(interview);
	} catch (error) {
		next(error);
	}
};
