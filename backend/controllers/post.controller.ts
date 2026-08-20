import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import Post from "../models/post.model";
import Comment from "../models/comment.model";
import Like from "../models/like.model";
import Notification from "../models/notification.model";
import { sendCommentNotificationEmail } from "../emails/emailHandlers";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ApiError } from "../lib/ApiError";
import { formatPaginatedResult, getPaginationParams } from "../lib/pagination";
import { uploadBufferToCloudinary } from "../lib/multer";
import cloudinary from "../lib/cloudinary";

export const getFeedPosts = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const currentUserId = req.user._id;
		const authorIds = [...req.user.connections, currentUserId];
		const { cursor, limit } = getPaginationParams(req);

		const matchStage: Record<string, any> = {
			author: { $in: authorIds },
			deletedAt: null,
		};

		if (cursor) {
			matchStage.createdAt = { $lt: new Date(cursor) };
		}

		// Single aggregation pipeline for all feed posts with likes, like status, comments, and author
		const posts = await Post.aggregate([
			{ $match: matchStage },
			{ $sort: { createdAt: -1 } },
			{ $limit: limit + 1 },
			{
				$lookup: {
					from: "users",
					localField: "author",
					foreignField: "_id",
					as: "author",
					pipeline: [
						{
							$project: {
								name: 1,
								username: 1,
								profilePicture: 1,
								headline: 1,
							},
						},
					],
				},
			},
			{ $unwind: "$author" },
			{
				$lookup: {
					from: "likes",
					let: { postId: "$_id" },
					pipeline: [
						{
							$match: {
								$expr: { $eq: ["$postId", "$$postId"] },
							},
						},
					],
					as: "likesData",
				},
			},
			{
				$lookup: {
					from: "comments",
					let: { postId: "$_id" },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [{ $eq: ["$postId", "$$postId"] }, { $eq: ["$deletedAt", null] }],
								},
							},
						},
						{ $sort: { createdAt: 1 } },
						{
							$lookup: {
								from: "users",
								localField: "authorId",
								foreignField: "_id",
								as: "user",
								pipeline: [
									{
										$project: {
											name: 1,
											username: 1,
											profilePicture: 1,
											headline: 1,
										},
									},
								],
							},
						},
						{ $unwind: "$user" },
						{
							$project: {
								_id: 1,
								content: 1,
								createdAt: 1,
								user: 1,
							},
						},
					],
					as: "comments",
				},
			},
			{
				$addFields: {
					likesCount: { $size: "$likesData" },
					isLiked: { $in: [currentUserId, "$likesData.userId"] },
					likes: "$likesData.userId",
					commentsCount: { $size: "$comments" },
				},
			},
			{
				$project: {
					likesData: 0,
				},
			},
		]);

		const paginatedResult = formatPaginatedResult(posts, limit);
		res.status(200).json(paginatedResult);
	} catch (error) {
		next(error);
	}
};

export const createPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}
		const { content } = req.body;
		let imageUrl: string | undefined = undefined;

		// 1. Multipart file from multer
		if (req.file) {
			try {
				const uploadRes = await uploadBufferToCloudinary(req.file.buffer, "linkedin_posts");
				imageUrl = uploadRes.secure_url;
			} catch (uploadError: any) {
				console.warn("Cloudinary upload failed via Multer, continuing:", uploadError.message);
			}
		} else if (req.body.image && typeof req.body.image === "string") {
			// 2. Base64 fallback if sent as JSON string
			if (req.body.image.startsWith("data:image")) {
				try {
					const imgResult = await cloudinary.uploader.upload(req.body.image);
					imageUrl = imgResult.secure_url;
				} catch (uploadError: any) {
					console.warn("Cloudinary base64 upload failed:", uploadError.message);
					imageUrl = req.body.image;
				}
			} else {
				imageUrl = req.body.image;
			}
		}

		const newPost = new Post({
			author: req.user._id,
			content,
			image: imageUrl,
			deletedAt: null,
		});

		await newPost.save();
		const populated = await newPost.populate("author", "name username profilePicture headline");

		res.status(201).json({
			...populated.toObject(),
			likes: [],
			likesCount: 0,
			isLiked: false,
			comments: [],
			commentsCount: 0,
		});
	} catch (error) {
		next(error);
	}
};

export const deletePost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}
		const postId = req.params.id;
		const userId = req.user._id;

		const post = await Post.findById(postId);

		if (!post) {
			throw ApiError.notFound("Post not found");
		}

		if (post.author.toString() !== userId.toString() && req.user.role !== "admin") {
			throw ApiError.forbidden("You are not authorized to delete this post");
		}

		if (post.image && process.env.CLOUDINARY_API_KEY && post.image.includes("res.cloudinary.com")) {
			try {
				const publicId = post.image.split("/").pop()?.split(".")[0];
				if (publicId) {
					await cloudinary.uploader.destroy(publicId);
				}
			} catch (destroyError: any) {
				console.warn("Cloudinary destroy error:", destroyError.message);
			}
		}

		await post.softDelete();
		await Comment.updateMany({ postId: post._id }, { $set: { deletedAt: new Date() } });

		res.status(200).json({ success: true, message: "Post deleted successfully" });
	} catch (error) {
		next(error);
	}
};

export const getPostById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		const postId = req.params.id;
		const currentUserId = req.user?._id;

		const posts = await Post.aggregate([
			{
				$match: {
					_id: new mongoose.Types.ObjectId(postId as string),
					deletedAt: null,
				},
			},
			{
				$lookup: {
					from: "users",
					localField: "author",
					foreignField: "_id",
					as: "author",
					pipeline: [
						{
							$project: {
								name: 1,
								username: 1,
								profilePicture: 1,
								headline: 1,
							},
						},
					],
				},
			},
			{ $unwind: "$author" },
			{
				$lookup: {
					from: "likes",
					let: { postId: "$_id" },
					pipeline: [
						{
							$match: {
								$expr: { $eq: ["$postId", "$$postId"] },
							},
						},
					],
					as: "likesData",
				},
			},
			{
				$lookup: {
					from: "comments",
					let: { postId: "$_id" },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [{ $eq: ["$postId", "$$postId"] }, { $eq: ["$deletedAt", null] }],
								},
							},
						},
						{ $sort: { createdAt: 1 } },
						{
							$lookup: {
								from: "users",
								localField: "authorId",
								foreignField: "_id",
								as: "user",
								pipeline: [
									{
										$project: {
											name: 1,
											username: 1,
											profilePicture: 1,
											headline: 1,
										},
									},
								],
							},
						},
						{ $unwind: "$user" },
						{
							$project: {
								_id: 1,
								content: 1,
								createdAt: 1,
								user: 1,
							},
						},
					],
					as: "comments",
				},
			},
			{
				$addFields: {
					likesCount: { $size: "$likesData" },
					isLiked: currentUserId ? { $in: [currentUserId, "$likesData.userId"] } : false,
					likes: "$likesData.userId",
					commentsCount: { $size: "$comments" },
				},
			},
			{
				$project: {
					likesData: 0,
				},
			},
		]);

		if (!posts || posts.length === 0) {
			throw ApiError.notFound("Post not found");
		}

		res.status(200).json(posts[0]);
	} catch (error) {
		next(error);
	}
};

export const createComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}
		const postId = req.params.id;
		const { content } = req.body;

		const post = await Post.findOne({ _id: postId, deletedAt: null }).populate(
			"author",
			"name email username headline profilePicture"
		);

		if (!post) {
			throw ApiError.notFound("Post not found");
		}

		const comment = new Comment({
			postId: post._id,
			authorId: req.user._id,
			content,
			deletedAt: null,
		});

		await comment.save();

		const formattedComment = {
			_id: comment._id,
			content: comment.content,
			createdAt: comment.createdAt,
			user: {
				_id: req.user._id,
				name: req.user.name,
				username: req.user.username,
				profilePicture: req.user.profilePicture,
				headline: req.user.headline,
			},
		};

		if (post.author._id.toString() !== req.user._id.toString()) {
			const newNotification = new Notification({
				recipient: post.author._id,
				type: "comment",
				relatedUser: req.user._id,
				relatedPost: post._id,
			});

			await newNotification.save();

			try {
				const postUrl = (process.env.CLIENT_URL || "http://localhost:5173") + "/post/" + postId;
				await sendCommentNotificationEmail(
					post.author.email,
					post.author.name,
					req.user.name,
					postUrl,
					content
				);
			} catch (error) {
				console.error("Error in sending comment notification email:", error);
			}
		}

		res.status(201).json(formattedComment);
	} catch (error) {
		next(error);
	}
};

export const deleteComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}
		const { commentId } = req.params;
		const comment = await Comment.findOne({ _id: commentId, deletedAt: null });

		if (!comment) {
			throw ApiError.notFound("Comment not found");
		}

		const post = await Post.findById(comment.postId);

		const isCommentAuthor = comment.authorId.toString() === req.user._id.toString();
		const isPostAuthor = post && post.author.toString() === req.user._id.toString();
		const isAdmin = req.user.role === "admin";

		if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
			throw ApiError.forbidden("Unauthorized to delete this comment");
		}

		await comment.softDelete();

		res.json({ success: true, message: "Comment deleted successfully" });
	} catch (error) {
		next(error);
	}
};

export const getPostComments = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const postId = req.params.id;
		const { cursor, limit } = getPaginationParams(req);

		const query: Record<string, any> = { postId, deletedAt: null };
		if (cursor) {
			query.createdAt = { $gt: new Date(cursor) }; // chronological
		}

		const comments = await Comment.find(query)
			.populate("authorId", "name username profilePicture headline")
			.sort({ createdAt: 1 })
			.limit(limit + 1);

		const formatted = comments.map((c: any) => ({
			_id: c._id,
			content: c.content,
			createdAt: c.createdAt,
			user: c.authorId,
		}));

		const result = formatPaginatedResult(formatted, limit);
		res.json(result);
	} catch (error) {
		next(error);
	}
};

export const likePost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}
		const postId = req.params.id;
		const userId = req.user._id;

		const post = await Post.findOne({ _id: postId, deletedAt: null });
		if (!post) {
			throw ApiError.notFound("Post not found");
		}

		const existingLike = await Like.findOne({ postId: post._id, userId });

		if (existingLike) {
			// Unlike
			await Like.findByIdAndDelete(existingLike._id);
			const likesCount = await Like.countDocuments({ postId: post._id });
			res.status(200).json({ isLiked: false, likesCount, message: "Post unliked" });
		} else {
			// Like
			await Like.create({ postId: post._id, userId });
			const likesCount = await Like.countDocuments({ postId: post._id });

			if (post.author.toString() !== userId.toString()) {
				const newNotification = new Notification({
					recipient: post.author,
					type: "like",
					relatedUser: userId,
					relatedPost: postId,
				});

				await newNotification.save();
			}

			res.status(200).json({ isLiked: true, likesCount, message: "Post liked" });
		}
	} catch (error) {
		next(error);
	}
};
