import { Response, NextFunction } from "express";
import Notification from "../models/notification.model";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ApiError } from "../lib/ApiError";
import { formatPaginatedResult, getPaginationParams } from "../lib/pagination";

export const getUserNotifications = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const { cursor, limit } = getPaginationParams(req);
		const query: Record<string, any> = { recipient: req.user._id };

		if (cursor) {
			query.createdAt = { $lt: new Date(cursor) };
		}

		// Fetch limit + 1 items to determine hasMore
		const notifications = await Notification.find(query)
			.sort({ createdAt: -1 })
			.limit(limit + 1)
			.populate("relatedUser", "name username profilePicture")
			.populate("relatedPost", "content image")
			.populate("relatedJob", "title company location")
			.populate("relatedInterview", "status scheduledAt");

		const result = formatPaginatedResult(notifications, limit);
		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
};

export const getUnreadNotificationsCount = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const count = await Notification.countDocuments({
			recipient: req.user._id,
			read: false,
		});

		res.status(200).json({ count });
	} catch (error) {
		next(error);
	}
};

export const markNotificationAsRead = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const notificationId = req.params.id;
		const notification = await Notification.findByIdAndUpdate(
			{ _id: notificationId, recipient: req.user._id },
			{ read: true },
			{ new: true }
		);

		if (!notification) {
			throw ApiError.notFound("Notification not found");
		}

		res.json(notification);
	} catch (error) {
		next(error);
	}
};

export const deleteNotification = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const notificationId = req.params.id;
		const deleted = await Notification.findOneAndDelete({
			_id: notificationId,
			recipient: req.user._id,
		});

		if (!deleted) {
			throw ApiError.notFound("Notification not found");
		}

		res.json({ message: "Notification deleted successfully" });
	} catch (error) {
		next(error);
	}
};
