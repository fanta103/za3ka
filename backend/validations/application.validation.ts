import { z } from "zod";

export const applyJobSchema = z.object({
	jobId: z.string().min(1, "Job ID is required"),
	coverLetter: z.string().max(3000, "Cover letter too long").optional(),
	resumeUrl: z.string().url("Invalid resume URL").optional().or(z.literal("")),
});

export const updateApplicationStatusSchema = z.object({
	status: z.enum(["applied", "screening", "interview", "offered", "rejected", "withdrawn"]),
	notes: z.string().max(3000, "Notes too long").optional(),
});

export const applicationIdParamSchema = z.object({
	id: z.string().min(1, "Application ID is required"),
});

export const jobApplicationsParamSchema = z.object({
	jobId: z.string().min(1, "Job ID is required"),
});

export type ApplyJobInput = z.infer<typeof applyJobSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
export type JobApplicationsParamInput = z.infer<typeof jobApplicationsParamSchema>;

