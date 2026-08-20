import { Response, NextFunction } from "express";
import Conversation from "../models/conversation.model";
import Message from "../models/message.model";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ApiError } from "../lib/ApiError";
import { formatPaginatedResult, getPaginationParams } from "../lib/pagination";
import { uploadBufferToCloudinary } from "../lib/multer";
import cloudinary from "../lib/cloudinary";
import { getReceiverSocketId, io } from "../lib/socket";

/**
 * @swagger
 * /chat/conversations:
 *   get:
 *     summary: Get all conversations for the authenticated user
 *     tags: [Chat]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 */
export const getUserConversations = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const myId = req.user._id;

		const conversations = await Conversation.find({
			participants: myId,
		})
			.populate("participants", "name username profilePicture headline role location")
			.sort({ lastMessageAt: -1, updatedAt: -1 });

		// Format output with computed unread count for the current user
		const formatted = conversations.map((conv) => {
			const unreadObj = conv.unreadCounts.find(
				(u) => u.userId.toString() === myId.toString()
			);
			const otherParticipant = conv.participants.find(
				(p: any) => p._id?.toString() !== myId.toString()
			);

			return {
				...conv.toObject(),
				myUnreadCount: unreadObj?.count || 0,
				otherParticipant,
			};
		});

		res.json(formatted);
	} catch (error) {
		next(error);
	}
};

/**
 * @swagger
 * /chat/conversations:
 *   post:
 *     summary: Find or create a conversation with a target user
 *     tags: [Chat]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               participantId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conversation found or created
 *       400:
 *         description: Cannot chat with self or invalid user
 */
export const getOrCreateConversation = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const targetUserId = req.body.userId || req.body.participantId;
		const myId = req.user._id;

		if (!targetUserId) {
			throw ApiError.badRequest("Target userId is required");
		}

		if (targetUserId === myId.toString()) {
			throw ApiError.badRequest("Cannot create conversation with yourself");
		}

		// Note: Chat is allowed between non-connections (LinkedIn-like behavior)
		// If connection requirement is needed, add validation here

		let conversation = await Conversation.findOne({
			participants: { $all: [myId, targetUserId], $size: 2 },
		}).populate("participants", "name username profilePicture headline role location");

		if (!conversation) {
			conversation = new Conversation({
				participants: [myId, targetUserId],
				unreadCounts: [
					{ userId: myId, count: 0 },
					{ userId: targetUserId, count: 0 },
				],
			});
			await conversation.save();
			conversation = await conversation.populate(
				"participants",
				"name username profilePicture headline role location"
			);
		}

		const otherParticipant = conversation.participants.find(
			(p: any) => p._id?.toString() !== myId.toString()
		);

		res.json({
			...conversation.toObject(),
			myUnreadCount: 0,
			otherParticipant,
		});
	} catch (error) {
		next(error);
	}
};

/**
 * @swagger
 * /chat/conversations/{conversationId}/messages:
 *   get:
 *     summary: Get paginated messages for a conversation (marks as read)
 *     tags: [Chat]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated messages
 *       404:
 *         description: Conversation not found
 */
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
		const myId = req.user._id;

		const conversation = await Conversation.findOne({
			_id: conversationId,
			participants: myId,
		});

		if (!conversation) {
			throw ApiError.notFound("Conversation not found");
		}

		const { cursor, limit } = getPaginationParams(req);
		const query: Record<string, any> = { conversationId };

		if (cursor) {
			query.createdAt = { $lt: new Date(cursor) };
		}

		// Fetch messages sorted newest first for cursor pagination
		const messages = await Message.find(query)
			.populate("senderId", "name username profilePicture")
			.sort({ createdAt: -1 })
			.limit(limit + 1);

		// Mark fetched unread messages as read by current user in background
		Message.updateMany(
			{ conversationId, readBy: { $ne: myId } },
			{ $addToSet: { readBy: myId } }
		).exec().catch((err) => console.warn("Failed to mark messages read:", err.message));

		// Reset current user's unread count in conversation
		const myUnreadIndex = conversation.unreadCounts.findIndex(
			(u) => u.userId.toString() === myId.toString()
		);
		if (myUnreadIndex !== -1 && conversation.unreadCounts[myUnreadIndex].count > 0) {
			conversation.unreadCounts[myUnreadIndex].count = 0;
			await conversation.save();
		}

		const result = formatPaginatedResult(messages, limit);
		res.json(result);
	} catch (error) {
		next(error);
	}
};

/**
 * @swagger
 * /chat/messages:
 *   post:
 *     summary: Send a 1-on-1 message in a conversation (text or image)
 *     tags: [Chat]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *             properties:
 *               conversationId:
 *                 type: string
 *               text:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Message must have text or image
 *       404:
 *         description: Conversation not found
 */
export const sendMessage = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const { conversationId, text } = req.body;
		const myId = req.user._id;

		const conversation = await Conversation.findOne({
			_id: conversationId,
			participants: myId,
		});

		if (!conversation) {
			throw ApiError.notFound("Conversation not found");
		}

		let imageUrl: string | undefined = undefined;

		// 1. Check if multipart image uploaded
		if (req.file) {
			try {
				const uploadRes = await uploadBufferToCloudinary(req.file.buffer, "linkedin_chat");
				imageUrl = uploadRes.secure_url;
			} catch (uploadError: any) {
				console.warn("Cloudinary chat image upload failed:", uploadError.message);
			}
		} else if (req.body.image && typeof req.body.image === "string") {
			// 2. Base64 or URL fallback
			if (req.body.image.startsWith("data:image")) {
				try {
					const imgResult = await cloudinary.uploader.upload(req.body.image, {
						folder: "linkedin_chat",
					});
					imageUrl = imgResult.secure_url;
				} catch (uploadError: any) {
					console.warn("Cloudinary base64 chat image failed:", uploadError.message);
					imageUrl = req.body.image;
				}
			} else {
				imageUrl = req.body.image;
			}
		}

		if (!text?.trim() && !imageUrl) {
			throw ApiError.badRequest("Message must contain text or an image");
		}

		const message = new Message({
			conversationId,
			senderId: myId,
			text: text ? text.trim() : "",
			image: imageUrl,
			readBy: [myId],
		});

		await message.save();

		// Update conversation metadata
		conversation.lastMessage = text?.trim() || (imageUrl ? "📷 [Image]" : "");
		conversation.lastMessageAt = new Date();

		// Increment unread count for other participants
		const otherParticipantIds = conversation.participants
			.map((p) => (typeof p === "object" && p._id ? p._id.toString() : p.toString()))
			.filter((id) => id !== myId.toString());

		otherParticipantIds.forEach((pId) => {
			const unreadEntry = conversation.unreadCounts.find(
				(u) => u.userId.toString() === pId
			);
			if (unreadEntry) {
				unreadEntry.count += 1;
			} else {
				conversation.unreadCounts.push({ userId: pId as any, count: 1 });
			}
		});

		await conversation.save();

		const populatedMessage = await message.populate(
			"senderId",
			"name username profilePicture headline"
		);

		// Real-time delivery via Socket.IO
		otherParticipantIds.forEach((receiverId) => {
			const receiverSocketId = getReceiverSocketId(receiverId);
			if (receiverSocketId) {
				io.to(receiverSocketId).emit("newMessage", populatedMessage);
			}
		});

		res.status(201).json(populatedMessage);
	} catch (error) {
		next(error);
	}
};

