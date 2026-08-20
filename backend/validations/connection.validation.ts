import { z } from "zod";

export const userIdParamSchema = z.object({
	userId: z.string().min(1, "User ID is required"),
});

export const requestIdParamSchema = z.object({
	requestId: z.string().min(1, "Request ID is required"),
});

export const statusBatchSchema = z.object({
	userIds: z.array(z.string()).min(1, "userIds array cannot be empty").max(100, "Max 100 userIds per batch"),
});

export type StatusBatchInput = z.infer<typeof statusBatchSchema>;
