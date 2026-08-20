import { z } from "zod";

export const createPostSchema = z
	.object({
		content: z.string().max(3000, "Content cannot exceed 3000 characters").optional().default(""),
		image: z.string().optional(),
	})
	.refine((data) => (data.content && data.content.trim().length > 0) || (data.image && data.image.length > 0), {
		message: "Post must have either text content or an image",
	});

export const createCommentSchema = z.object({
	content: z.string().min(1, "Comment content cannot be empty").max(1000, "Comment cannot exceed 1000 characters"),
});

export const postIdParamSchema = z.object({
	id: z.string().min(1, "Post ID is required"),
});

export const commentIdParamSchema = z.object({
	commentId: z.string().min(1, "Comment ID is required"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
