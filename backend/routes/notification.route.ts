import express from "express";
import { protectRoute } from "../middleware/auth.middleware";
import {
	deleteNotification,
	getUnreadNotificationsCount,
	getUserNotifications,
	markNotificationAsRead,
} from "../controllers/notification.controller";
import { validateRequest } from "../middleware/validate.middleware";
import { notificationIdParamSchema } from "../validations/notification.validation";

const router = express.Router();

router.get("/", protectRoute, getUserNotifications);
router.get("/unread-count", protectRoute, getUnreadNotificationsCount);
router.put("/:id/read", protectRoute, validateRequest({ params: notificationIdParamSchema }), markNotificationAsRead);
router.delete("/:id", protectRoute, validateRequest({ params: notificationIdParamSchema }), deleteNotification);

export default router;
