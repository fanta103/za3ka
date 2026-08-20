import { Response, NextFunction } from "express";
import ConnectionRequest from "../models/connectionRequest.model";
import User from "../models/user.model";
import Notification from "../models/notification.model";
import { sendConnectionAcceptedEmail } from "../emails/emailHandlers";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ApiError } from "../lib/ApiError";
import { formatPaginatedResult, getPaginationParams } from "../lib/pagination";

export const sendConnectionRequest = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const { userId } = req.params;
		const senderId = req.user._id;

		if (senderId.toString() === userId) {
			throw ApiError.badRequest("You can't send a request to yourself");
		}

		if (req.user.connections.some((id: any) => id.toString() === userId)) {
			throw ApiError.badRequest("You are already connected with this user");
		}

		const existingRequest = await ConnectionRequest.findOne({
			sender: senderId,
			recipient: userId,
			status: "pending",
		});

		if (existingRequest) {
			throw ApiError.badRequest("A connection request already exists");
		}

		const newRequest = new ConnectionRequest({
			sender: senderId,
			recipient: userId,
		});

		await newRequest.save();

		res.status(201).json(newRequest);
	} catch (error) {
		next(error);
	}
};

export const acceptConnectionRequest = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const { requestId } = req.params;
		const userId = req.user._id;

		const request = await ConnectionRequest.findById(requestId)
			.populate("sender", "name email username")
			.populate("recipient", "name username");

		if (!request) {
			throw ApiError.notFound("Connection request not found");
		}

		if (request.recipient._id.toString() !== userId.toString()) {
			throw ApiError.forbidden("Not authorized to accept this request");
		}

		if (request.status !== "pending") {
			throw ApiError.badRequest("This request has already been processed");
		}

		const notification = new Notification({
			recipient: request.sender._id,
			type: "connectionAccepted",
			relatedUser: userId,
		});

		request.status = "accepted";
		await Promise.all([
			request.save(),
			User.findByIdAndUpdate(request.sender._id, { $addToSet: { connections: userId } }),
			User.findByIdAndUpdate(userId, { $addToSet: { connections: request.sender._id } }),
			notification.save(),
		]);

		const senderEmail = request.sender.email;
		const senderName = request.sender.name;
		const recipientName = request.recipient.name;
		const profileUrl = (process.env.CLIENT_URL || "http://localhost:5173") + "/profile/" + request.recipient.username;

		void sendConnectionAcceptedEmail(senderEmail, senderName, recipientName, profileUrl).catch((error) =>
			console.error("Error in sendConnectionAcceptedEmail:", error)
		);

		res.json({ message: "Connection accepted successfully" });
	} catch (error) {
		next(error);
	}
};

export const rejectConnectionRequest = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const { requestId } = req.params;
		const userId = req.user._id;

		const request = await ConnectionRequest.findById(requestId);

		if (!request) {
			throw ApiError.notFound("Connection request not found");
		}

		if (request.recipient.toString() !== userId.toString()) {
			throw ApiError.forbidden("Not authorized to reject this request");
		}

		if (request.status !== "pending") {
			throw ApiError.badRequest("This request has already been processed");
		}

		request.status = "rejected";
		await request.save();

		res.json({ message: "Connection request rejected" });
	} catch (error) {
		next(error);
	}
};

export const getConnectionRequests = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const userId = req.user._id;
		const requests = await ConnectionRequest.find({
			recipient: userId,
			status: "pending",
		}).populate("sender", "name username profilePicture headline connections");

		res.json(requests);
	} catch (error) {
		next(error);
	}
};

export const getUserConnections = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const userId = req.user._id;
		const user = await User.findById(userId).populate(
			"connections",
			"name username profilePicture headline connections createdAt"
		);

		if (!user) {
			throw ApiError.notFound("User not found");
		}

		const { cursor, limit } = getPaginationParams(req);
		let connections = (user.connections || []) as any[];

		if (cursor) {
			const cursorDate = new Date(cursor).getTime();
			connections = connections.filter((c) => new Date(c.createdAt || 0).getTime() < cursorDate);
		}

		const result = formatPaginatedResult(connections, limit);
		res.json(result);
	} catch (error) {
		next(error);
	}
};

export const removeConnection = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const myId = req.user._id;
		const { userId } = req.params;

		await User.findByIdAndUpdate(myId, { $pull: { connections: userId } });
		await User.findByIdAndUpdate(userId, { $pull: { connections: myId } });

		res.json({ message: "Connection removed successfully" });
	} catch (error) {
		next(error);
	}
};

export const getConnectionStatus = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const targetUserId = req.params.userId;
		const currentUserId = req.user._id;

		// Check if already connected using database query to ensure populated data
		const currentUser = await User.findById(currentUserId).select("connections");
		if (currentUser && currentUser.connections.some((id: any) => id.toString() === targetUserId)) {
			res.json({ status: "connected" });
			return;
		}

		const pendingRequest = await ConnectionRequest.findOne({
			$or: [
				{ sender: currentUserId, recipient: targetUserId },
				{ sender: targetUserId, recipient: currentUserId },
			],
			status: "pending",
		});

		if (pendingRequest) {
			if (pendingRequest.sender.toString() === currentUserId.toString()) {
				res.json({ status: "pending" });
			} else {
				res.json({ status: "received", requestId: pendingRequest._id });
			}
			return;
		}

		res.json({ status: "not_connected" });
	} catch (error) {
		next(error);
	}
};

export const getConnectionStatusBatch = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const { userIds } = req.body as { userIds: string[] };
		const currentUserId = req.user._id;
		const myConnections = (req.user.connections || []).map((id: any) => id.toString());

		// Find pending requests between current user and target userIds in a single query
		const pendingRequests = await ConnectionRequest.find({
			$or: [
				{ sender: currentUserId, recipient: { $in: userIds } },
				{ sender: { $in: userIds }, recipient: currentUserId },
			],
			status: "pending",
		});

		const results: Record<string, { status: string; requestId?: string }> = {};

		for (const targetId of userIds) {
			if (myConnections.includes(targetId)) {
				results[targetId] = { status: "connected" };
				continue;
			}

			const reqForUser = pendingRequests.find(
				(r) =>
					(r.sender.toString() === currentUserId.toString() && r.recipient.toString() === targetId) ||
					(r.sender.toString() === targetId && r.recipient.toString() === currentUserId.toString())
			);

			if (reqForUser) {
				if (reqForUser.sender.toString() === currentUserId.toString()) {
					results[targetId] = { status: "pending" };
				} else {
					results[targetId] = { status: "received", requestId: reqForUser._id.toString() };
				}
			} else {
				results[targetId] = { status: "not_connected" };
			}
		}

		res.json({ results });
	} catch (error) {
		next(error);
	}
};
