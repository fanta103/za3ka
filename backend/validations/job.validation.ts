import { z } from "zod";

export const createJobSchema = z.object({
	title: z.string().min(1, "Job title is required").max(200, "Job title is too long"),
	company: z.string().min(1, "Company name is required").max(100, "Company name is too long"),
	location: z.string().min(1, "Location is required").max(100, "Location is too long"),
	type: z.enum(["full-time", "part-time", "contract", "internship", "remote"]),
	salaryMin: z.number().nonnegative().optional(),
	salaryMax: z.number().nonnegative().optional(),
	description: z.string().min(10, "Description must be at least 10 characters").max(5000, "Description too long"),
	requirements: z.array(z.string()).optional().default([]),
	status: z.enum(["open", "closed", "paused"]).optional().default("open"),
});

export const updateJobSchema = createJobSchema.partial();

export const updateJobStatusSchema = z.object({
	status: z.enum(["open", "closed", "paused"]),
});

export const jobIdParamSchema = z.object({
	id: z.string().min(1, "Job ID is required"),
});

export const jobQuerySchema = z.object({
	type: z.enum(["full-time", "part-time", "contract", "internship", "remote"]).optional(),
	location: z.string().optional(),
	status: z.enum(["open", "closed", "paused"]).optional(),
	search: z.string().optional(),
	authorId: z.string().optional(),
	cursor: z.string().optional(),
	limit: z.string().optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type UpdateJobStatusInput = z.infer<typeof updateJobStatusSchema>;
export type JobQueryInput = z.infer<typeof jobQuerySchema>;

