import { Response, NextFunction } from "express";
import User from "../models/user.model";
import Job from "../models/job.model";
import Post from "../models/post.model";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export const searchAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		const q = String(req.query.q || "").trim();
		const type = String(req.query.type || "all");

		const results: { users?: any[]; jobs?: any[]; posts?: any[] } = {};

		// Search users
		if (type === "all" || type === "users") {
			results.users = await User.find(
				{
					$or: [
						{ $text: { $search: q } },
						{ name: { $regex: q, $options: "i" } },
						{ username: { $regex: q, $options: "i" } },
						{ headline: { $regex: q, $options: "i" } },
					],
				},
				{ score: { $meta: "textScore" } }
			)
				.select("name username profilePicture headline location role skills")
				.sort({ score: { $meta: "textScore" } })
				.limit(10);
		}

		// Search jobs
		if (type === "all" || type === "jobs") {
			results.jobs = await Job.find(
				{
					status: "open",
					$or: [
						{ $text: { $search: q } },
						{ title: { $regex: q, $options: "i" } },
						{ company: { $regex: q, $options: "i" } },
						{ location: { $regex: q, $options: "i" } },
					],
				},
				{ score: { $meta: "textScore" } }
			)
				.populate("authorId", "name username profilePicture headline")
				.sort({ score: { $meta: "textScore" } })
				.limit(10);
		}

		// Search posts
		if (type === "all" || type === "posts") {
			results.posts = await Post.find(
				{
					deletedAt: null,
					$or: [
						{ $text: { $search: q } },
						{ content: { $regex: q, $options: "i" } },
					],
				},
				{ score: { $meta: "textScore" } }
			)
				.populate("author", "name username profilePicture headline")
				.sort({ score: { $meta: "textScore" }, createdAt: -1 })
				.limit(10);
		}

		res.json(results);
	} catch (error) {
		next(error);
	}
};
