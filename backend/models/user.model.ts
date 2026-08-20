import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type UserRole = "jobseeker" | "recruiter" | "admin";

export interface IExperience {
	_id?: Types.ObjectId;
	title?: string;
	company?: string;
	startDate?: Date;
	endDate?: Date;
	description?: string;
}

export interface IEducation {
	_id?: Types.ObjectId;
	school?: string;
	fieldOfStudy?: string;
	startYear?: number;
	endYear?: number;
}

export interface IUser extends Document {
	_id: Types.ObjectId;
	name: string;
	username: string;
	email: string;
	password: string;
	role: UserRole;
	profilePicture: string;
	bannerImg: string;
	headline: string;
	location: string;
	about: string;
	skills: string[];
	experience: IExperience[];
	education: IEducation[];
	connections: Types.ObjectId[];
	isVerified: boolean;
	verificationToken?: string;
	resetPasswordToken?: string;
	resetPasswordExpires?: Date;
	refreshToken?: string;
	createdAt: Date;
	updatedAt: Date;
}

const userSchema = new Schema<IUser>(
	{
		name: {
			type: String,
			required: true,
		},
		username: { type: String, required: true, unique: true },
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		role: {
			type: String,
			enum: ["jobseeker", "recruiter", "admin"],
			default: "jobseeker",
			required: true,
		},
		profilePicture: {
			type: String,
			default: "",
		},
		bannerImg: {
			type: String,
			default: "",
		},
		headline: {
			type: String,
			default: "Linkedin User",
		},
		location: {
			type: String,
			default: "Earth",
		},
		about: {
			type: String,
			default: "",
		},
		skills: [String],
		experience: [
			{
				title: String,
				company: String,
				startDate: Date,
				endDate: Date,
				description: String,
			},
		],
		education: [
			{
				school: String,
				fieldOfStudy: String,
				startYear: Number,
				endYear: Number,
			},
		],
		connections: [
			{
				type: Schema.Types.ObjectId,
				ref: "User",
			},
		],
		isVerified: {
			type: Boolean,
			default: false,
		},
		verificationToken: {
			type: String,
		},
		resetPasswordToken: {
			type: String,
		},
		resetPasswordExpires: {
			type: Date,
		},
		refreshToken: {
			type: String,
		},
	},
	{ timestamps: true }
);

// Index for refresh token lookup optimization
userSchema.index({ refreshToken: 1 });

// Full text search index on name, headline, username
userSchema.index({ name: "text", headline: "text", username: "text" });

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
