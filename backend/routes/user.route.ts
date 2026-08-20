import express from "express";
import { protectRoute } from "../middleware/auth.middleware";
import { getPublicProfile, getSuggestedConnections, updateProfile } from "../controllers/user.controller";
import { validateRequest } from "../middleware/validate.middleware";
import { updateProfileSchema, usernameParamSchema } from "../validations/user.validation";
import { upload } from "../lib/multer";

const router = express.Router();

router.get("/suggestions", protectRoute, getSuggestedConnections);
router.get("/:username", protectRoute, validateRequest({ params: usernameParamSchema }), getPublicProfile);
router.put(
	"/profile",
	protectRoute,
	upload.fields([
		{ name: "profilePicture", maxCount: 1 },
		{ name: "bannerImg", maxCount: 1 },
	]),
	validateRequest({ body: updateProfileSchema }),
	updateProfile
);

export default router;
