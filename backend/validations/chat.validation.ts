import { z } from "zod";

export const startConversationSchema = z.object({
	participantId: z.string().min(1, "Participant ID is required"),
});

export const sendMessageSchema = z
	.object({
		conversationId: z.string().min(1, "Conversation ID is required"),
		text: z.string().max(2000, "Message text too long").optional().default(""),
		image: z.string().optional(),
	})
	.refine((data) => (data.text && data.text.trim().length > 0) || (data.image && data.image.length > 0), {
		message: "Message must contain text or an image",
	});

export const conversationIdParamSchema = z.object({
	conversationId: z.string().min(1, "Conversation ID is required"),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
