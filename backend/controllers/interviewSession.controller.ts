import { Response, NextFunction } from "express";
import InterviewSession from "../models/interviewSession.model";
import Job from "../models/job.model";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ApiError } from "../lib/ApiError";

export const scheduleInterview = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}
		const { jobId, candidateId, scheduledAt, duration } = req.body;

		const job = await Job.findById(jobId);
		if (!job) {
			throw ApiError.notFound("Job not found");
		}

		const liveKitRoomName = `interview-${jobId}-${candidateId}-${Date.now()}`;

		const interview = new InterviewSession({
			jobId,
			candidateId,
			recruiterId: req.user._id,
			scheduledAt: new Date(scheduledAt),
			duration: duration || 30,
			liveKitRoomName,
		});

		await interview.save();

		const populated = await interview.populate([
			{ path: "jobId", select: "title company location" },
			{ path: "candidateId", select: "name username profilePicture headline email" },
			{ path: "recruiterId", select: "name username profilePicture headline email" },
		]);

		res.status(201).json(populated);
	} catch (error) {
		next(error);
	}
};

export const getMyInterviews = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}
		const myId = req.user._id;

		const interviews = await InterviewSession.find({
			$or: [{ candidateId: myId }, { recruiterId: myId }],
		})
			.populate("jobId", "title company location")
			.populate("candidateId", "name username profilePicture headline")
			.populate("recruiterId", "name username profilePicture headline")
			.sort({ scheduledAt: 1 });

		res.json(interviews);
	} catch (error) {
		next(error);
	}
};

export const getInterviewById = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}
		const interview = await InterviewSession.findById(req.params.id)
			.populate("jobId", "title company location description requirements")
			.populate("candidateId", "name username profilePicture headline email skills experience education")
			.populate("recruiterId", "name username profilePicture headline email");

		if (!interview) {
			throw ApiError.notFound("Interview session not found");
		}

		const isParticipant =
			interview.candidateId._id.toString() === req.user._id.toString() ||
			interview.recruiterId._id.toString() === req.user._id.toString() ||
			req.user.role === "admin";

		if (!isParticipant) {
			throw ApiError.forbidden("Forbidden - Not participant in this interview");
		}

		res.json(interview);
	} catch (error) {
		next(error);
	}
};

export const updateInterview = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}
		const interview = await InterviewSession.findById(req.params.id);

		if (!interview) {
			throw ApiError.notFound("Interview session not found");
		}

		const isParticipant =
			interview.candidateId.toString() === req.user._id.toString() ||
			interview.recruiterId.toString() === req.user._id.toString() ||
			req.user.role === "admin";

		if (!isParticipant) {
			throw ApiError.forbidden("Forbidden");
		}

		Object.assign(interview, req.body);
		await interview.save();

		res.json(interview);
	} catch (error) {
		next(error);
	}
};
