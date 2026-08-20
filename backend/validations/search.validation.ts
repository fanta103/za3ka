import { z } from "zod";

export const searchSchema = z.object({
	q: z
		.string()
		.min(2, "Search query must be at least 2 characters")
		.max(100, "Search query cannot exceed 100 characters"),
	type: z.enum(["all", "posts", "users", "jobs"]).optional().default("all"),
	cursor: z.string().optional(),
	limit: z.string().optional(),
});

export type SearchInput = z.infer<typeof searchSchema>;
