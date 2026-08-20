import express from "express";
import { protectRoute } from "../middleware/auth.middleware";
import {
	createPost,
	getFeedPosts,
	deletePost,
	getPostById,
	createComment,
	deleteComment,
	getPostComments,
	likePost,
} from "../controllers/post.controller";
import { validateRequest } from "../middleware/validate.middleware";
import { createPostSchema, createCommentSchema, postIdParamSchema, commentIdParamSchema } from "../validations/post.validation";
import { upload } from "../lib/multer";

const router = express.Router();

router.get("/", protectRoute, getFeedPosts);
router.post(
	"/create",
	protectRoute,
	upload.single("image"),
	validateRequest({ body: createPostSchema }),
	createPost
);
router.delete("/delete/:id", protectRoute, validateRequest({ params: postIdParamSchema }), deletePost);
router.get("/:id", protectRoute, validateRequest({ params: postIdParamSchema }), getPostById);
router.get("/:id/comments", protectRoute, validateRequest({ params: postIdParamSchema }), getPostComments);
router.post(
	"/:id/comment",
	protectRoute,
	validateRequest({ params: postIdParamSchema, body: createCommentSchema }),
	createComment
);
router.delete("/comments/:commentId", protectRoute, validateRequest({ params: commentIdParamSchema }), deleteComment);
router.post("/:id/like", protectRoute, validateRequest({ params: postIdParamSchema }), likePost);

export default router;
