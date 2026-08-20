import mongoose, { Document, Model, Schema, Types, CallbackError } from "mongoose";

export type JobType = "full-time" | "part-time" | "contract" | "internship" | "remote";
export type JobStatus = "open" | "closed" | "paused";

export interface IJobDoc extends Document {
	_id: Types.ObjectId;
	title: string;
	company: string;
	location: string;
	type: JobType;
	salaryMin?: number;
	salaryMax?: number;
	description: string;
	requirements: string[];
	authorId: Types.ObjectId | any;
	status: JobStatus;
	applicantsCount: number;
	viewsCount: number;
	deletedAt?: Date | null;
	createdAt: Date;
	updatedAt: Date;
	softDelete(): Promise<IJobDoc>;
}

const jobSchema = new Schema<IJobDoc>(
	{
		title: {
			type: String,
			required: true,
			trim: true,
		},
		company: {
			type: String,
			required: true,
			trim: true,
		},
		location: {
			type: String,
			required: true,
			trim: true,
		},
		type: {
			type: String,
			enum: ["full-time", "part-time", "contract", "internship", "remote"],
			required: true,
		},
		salaryMin: {
			type: Number,
		},
		salaryMax: {
			type: Number,
		},
		description: {
			type: String,
			required: true,
			maxlength: 5000,
		},
		requirements: {
			type: [String],
			default: [],
		},
		authorId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		status: {
			type: String,
			enum: ["open", "closed", "paused"],
			default: "open",
		},
		applicantsCount: {
			type: Number,
			default: 0,
		},
		viewsCount: {
			type: Number,
			default: 0,
		},
		deletedAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true }
);

// Indexes
jobSchema.index({ authorId: 1, createdAt: -1 });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ location: 1, status: 1 });
jobSchema.index({ deletedAt: 1, createdAt: -1 });
jobSchema.index({ title: "text", company: "text", description: "text" });

// Soft delete pre-query middleware
const excludeSoftDeleted = function (this: any, next: (err?: CallbackError) => void) {
	if (this.getFilter().deletedAt === undefined) {
		this.where({ deletedAt: null });
	}
	next();
};

jobSchema.pre("find", excludeSoftDeleted);
jobSchema.pre("findOne", excludeSoftDeleted);
jobSchema.pre("countDocuments", excludeSoftDeleted);
jobSchema.pre("findOneAndUpdate", excludeSoftDeleted);

// Instance method for soft delete
jobSchema.methods.softDelete = function (this: IJobDoc) {
	this.deletedAt = new Date();
	return this.save();
};

const Job: Model<IJobDoc> = mongoose.model<IJobDoc>("Job", jobSchema);

export default Job;
