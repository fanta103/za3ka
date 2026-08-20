import express from "express";
import { protectRoute } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import {
	getConversationMessages,
	getOrCreateConversation,
	getUserConversations,
	sendMessage,
} from "../controllers/chat.controller";
import {
	conversationIdParamSchema,
	sendMessageSchema,
	startConversationSchema,
} from "../validations/chat.validation";
import { upload } from "../lib/multer";

const router = express.Router();

router.get("/conversations", protectRoute, getUserConversations);
router.post(
	"/conversations",
	protectRoute,
	validateRequest({ body: startConversationSchema }),
	getOrCreateConversation
);
router.get(
	"/conversations/:conversationId/messages",
	protectRoute,
	validateRequest({ params: conversationIdParamSchema }),
	getConversationMessages
);
router.post(
	"/messages",
	protectRoute,
	upload.single("image"),
	validateRequest({ body: sendMessageSchema }),
	sendMessage
);

export default router;

