import { Response, NextFunction } from "express";
import Conversation from "../models/conversation.model";
import Message from "../models/message.model";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ApiError } from "../lib/ApiError";

export const getOrCreateConversation = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}
		const { participantId } = req.body;
		const myId = req.user._id;

		if (participantId === myId.toString()) {
			throw ApiError.badRequest("Cannot create conversation with yourself");
		}

		let conversation = await Conversation.findOne({
			participants: { $all: [myId, participantId], $size: 2 },
		}).populate("participants", "name username profilePicture headline");

		if (!conversation) {
			conversation = new Conversation({
				participants: [myId, participantId],
				unreadCounts: [
					{ userId: myId, count: 0 },
					{ userId: participantId, count: 0 },
				],
			});
			await conversation.save();
			conversation = await conversation.populate("participants", "name username profilePicture headline");
		}

		res.json(conversation);
	} catch (error) {
		next(error);
	}
};

export const getUserConversations = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}
		const conversations = await Conversation.find({
			participants: req.user._id,
		})
			.populate("participants", "name username profilePicture headline")
			.sort({ updatedAt: -1 });

		res.json(conversations);
	} catch (error) {
		next(error);
	}
};

export const getConversationMessages = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}
		const { conversationId } = req.params;

		const conversation = await Conversation.findOne({
			_id: conversationId,
			participants: req.user._id,
		});

		if (!conversation) {
			throw ApiError.notFound("Conversation not found");
		}

		const messages = await Message.find({ conversationId })
			.populate("senderId", "name username profilePicture")
			.sort({ createdAt: 1 });

		res.json(messages);
	} catch (error) {
		next(error);
	}
};

export const sendMessage = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}
		const { conversationId, text, image } = req.body;

		const conversation = await Conversation.findOne({
			_id: conversationId,
			participants: req.user._id,
		});

		if (!conversation) {
			throw ApiError.notFound("Conversation not found");
		}

		const message = new Message({
			conversationId,
			senderId: req.user._id,
			text,
			image,
			readBy: [req.user._id],
		});

		await message.save();

		// Update conversation lastMessage metadata
		conversation.lastMessage = text || (image ? "[Image]" : "");
		conversation.lastMessageAt = new Date();
		await conversation.save();

		const populatedMessage = await message.populate("senderId", "name username profilePicture");

		res.status(201).json(populatedMessage);
	} catch (error) {
		next(error);
	}
};
