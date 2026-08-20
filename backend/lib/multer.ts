import multer from "multer";
import { Request } from "express";
import cloudinary from "./cloudinary";
import { ApiError } from "./ApiError";

// Memory storage for buffer processing
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
	const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
	if (allowedMimes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(ApiError.badRequest("Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed."));
	}
};

export const upload = multer({
	storage,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB limit
	},
	fileFilter,
});

const resumeFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
	const allowedMimes = [
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	];
	if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(pdf|doc|docx)$/i)) {
		cb(null, true);
	} else {
		cb(ApiError.badRequest("Invalid resume file type. Only PDF and DOCX documents are allowed (max 5MB)."));
	}
};

export const uploadResume = multer({
	storage,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB limit
	},
	fileFilter: resumeFileFilter,
});

// Helper to upload image buffer to Cloudinary
export const uploadBufferToCloudinary = (
	buffer: Buffer,
	folder: string = "linkedin_clone"
): Promise<{ secure_url: string; public_id: string }> => {
	return new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream(
			{
				folder,
				resource_type: "image",
			},
			(error, result) => {
				if (error || !result) {
					reject(error || new Error("Cloudinary upload failed"));
				} else {
					resolve({ secure_url: result.secure_url, public_id: result.public_id });
				}
			}
		);
		uploadStream.end(buffer);
	});
};

// Helper to upload document/PDF/raw buffer to Cloudinary
export const uploadDocumentToCloudinary = (
	buffer: Buffer,
	folder: string = "linkedin_resumes"
): Promise<{ secure_url: string; public_id: string }> => {
	return new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream(
			{
				folder,
				resource_type: "auto",
			},
			(error, result) => {
				if (error || !result) {
					reject(error || new Error("Cloudinary document upload failed"));
				} else {
					resolve({ secure_url: result.secure_url, public_id: result.public_id });
				}
			}
		);
		uploadStream.end(buffer);
	});
};

