import express from "express";
import { protectRoute } from "../middleware/auth.middleware";
import {
	acceptConnectionRequest,
	getConnectionRequests,
	getConnectionStatus,
	getConnectionStatusBatch,
	getUserConnections,
	rejectConnectionRequest,
	removeConnection,
	sendConnectionRequest,
} from "../controllers/connection.controller";
import { validateRequest } from "../middleware/validate.middleware";
import {
	requestIdParamSchema,
	statusBatchSchema,
	userIdParamSchema,
} from "../validations/connection.validation";

const router = express.Router();

router.post("/request/:userId", protectRoute, validateRequest({ params: userIdParamSchema }), sendConnectionRequest);
router.put("/accept/:requestId", protectRoute, validateRequest({ params: requestIdParamSchema }), acceptConnectionRequest);
router.put("/reject/:requestId", protectRoute, validateRequest({ params: requestIdParamSchema }), rejectConnectionRequest);
router.get("/requests", protectRoute, getConnectionRequests);
router.get("/", protectRoute, getUserConnections);
router.delete("/:userId", protectRoute, validateRequest({ params: userIdParamSchema }), removeConnection);
router.get("/status/:userId", protectRoute, validateRequest({ params: userIdParamSchema }), getConnectionStatus);
router.post("/status-batch", protectRoute, validateRequest({ body: statusBatchSchema }), getConnectionStatusBatch);

export default router;
