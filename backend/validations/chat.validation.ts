import { z } from "zod";

export const startConversationSchema = z.object({
	userId: z.string().optional(),
	participantId: z.string().optional(),
}).refine((data) => Boolean(data.userId || data.participantId), {
	message: "Recipient userId or participantId is required",
});

export const sendMessageSchema = z.object({
	conversationId: z.string().min(1, "Conversation ID is required"),
	text: z.string().max(2000, "Message text too long").optional(),
	image: z.string().optional(),
});

export const conversationIdParamSchema = z.object({
	conversationId: z.string().min(1, "Conversation ID is required"),
});

export type StartConversationInput = z.infer<typeof startConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

