import { Response, NextFunction } from "express";
import User from "../models/user.model";
import ConnectionRequest from "../models/connectionRequest.model";
import cloudinary from "../lib/cloudinary";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ApiError } from "../lib/ApiError";
import { uploadBufferToCloudinary } from "../lib/multer";

export const getSuggestedConnections = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const currentUser = (await User.findById(req.user._id).select("connections")) as any;

		if (!currentUser) {
			throw ApiError.notFound("User not found");
		}

		// Find users with pending connection requests
		const pendingRequests = await ConnectionRequest.find({
			$or: [
				{ sender: req.user._id, status: "pending" },
				{ recipient: req.user._id, status: "pending" },
			],
		}).select("sender recipient");

		const pendingUserIds = new Set();
		pendingRequests.forEach((req) => {
			pendingUserIds.add(req.sender.toString());
			pendingUserIds.add(req.recipient.toString());
		});

		// Find users who are not current user, not in connections, and not in pending requests
		const suggestedUsers = await User.find({
			_id: {
				$ne: req.user._id,
				$nin: [...currentUser.connections, ...Array.from(pendingUserIds)],
			},
		})
			.select("name username profilePicture headline")
			.limit(5);

		res.json(suggestedUsers);
	} catch (error) {
		next(error);
	}
};

export const getPublicProfile = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const user = await User.findOne({ username: req.params.username }).select("-password");
		if (!user) {
			throw ApiError.notFound("User not found");
		}

		res.json(user);
	} catch (error) {
		next(error);
	}
};

export const updateProfile = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.user) {
			throw ApiError.unauthorized("Authentication required");
		}

		const allowedFields = [
			"name",
			"username",
			"headline",
			"about",
			"location",
			"profilePicture",
			"bannerImg",
			"skills",
			"experience",
			"education",
		];

		const updatedData: Record<string, any> = {};

		for (const field of allowedFields) {
			if (req.body[field] !== undefined) {
				updatedData[field] = req.body[field];
			}
		}

		// Check if username is being changed and if it's already taken
		if (updatedData.username && updatedData.username !== req.user.username) {
			const existingUser = await User.findOne({ username: updatedData.username });
			if (existingUser) {
				throw ApiError.conflict("Username already taken", "USERNAME_EXISTS");
			}
		}

		// Handle multipart files from multer if present
		const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

		if (files?.profilePicture?.[0]) {
			try {
				const uploadRes = await uploadBufferToCloudinary(
					files.profilePicture[0].buffer,
					"linkedin_profiles"
				);
				updatedData.profilePicture = uploadRes.secure_url;
			} catch (uploadError: any) {
				console.warn("Cloudinary upload failed for profilePicture:", uploadError.message);
			}
		} else if (req.body.profilePicture && req.body.profilePicture.startsWith("data:image")) {
			try {
				const result = await cloudinary.uploader.upload(req.body.profilePicture);
				updatedData.profilePicture = result.secure_url;
			} catch (uploadError: any) {
				console.warn("Cloudinary base64 upload failed for profilePicture:", uploadError.message);
			}
		}

		if (files?.bannerImg?.[0]) {
			try {
				const uploadRes = await uploadBufferToCloudinary(
					files.bannerImg[0].buffer,
					"linkedin_banners"
				);
				updatedData.bannerImg = uploadRes.secure_url;
			} catch (uploadError: any) {
				console.warn("Cloudinary upload failed for bannerImg:", uploadError.message);
			}
		} else if (req.body.bannerImg && req.body.bannerImg.startsWith("data:image")) {
			try {
				const result = await cloudinary.uploader.upload(req.body.bannerImg);
				updatedData.bannerImg = result.secure_url;
			} catch (uploadError: any) {
				console.warn("Cloudinary base64 upload failed for bannerImg:", uploadError.message);
			}
		}

		const user = await User.findByIdAndUpdate(req.user._id, { $set: updatedData }, { new: true }).select(
			"-password"
		);

		res.json(user);
	} catch (error) {
		next(error);
	}
};
