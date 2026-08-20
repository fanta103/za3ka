import { z } from "zod";

export const scheduleInterviewSchema = z.object({
	jobId: z.string().min(1, "Job ID is required"),
	candidateId: z.string().min(1, "Candidate ID is required"),
	scheduledAt: z.string().or(z.date()),
	duration: z.number().int().positive().optional().default(30),
	note: z.string().max(500).optional(),
});

export const updateInterviewStatusSchema = z.object({
	status: z.enum(["scheduled", "in-progress", "completed", "cancelled"]),
});

export const updateInterviewSchema = z.object({
	status: z.enum(["scheduled", "in-progress", "completed", "cancelled"]).optional(),
	scheduledAt: z.string().or(z.date()).optional(),
	duration: z.number().int().positive().optional(),
	recordingUrl: z.string().url().optional(),
	recruiterFeedback: z
		.object({
			rating: z.number().min(1).max(5),
			notes: z.string().optional(),
		})
		.optional(),
});

export const feedbackSchema = z.object({
	rating: z.number().min(1).max(5),
	notes: z.string().max(2000).optional(),
});

export const interviewIdParamSchema = z.object({
	id: z.string().min(1, "Interview ID is required"),
});

export type ScheduleInterviewInput = z.infer<typeof scheduleInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof updateInterviewSchema>;
export type UpdateInterviewStatusInput = z.infer<typeof updateInterviewStatusSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;

