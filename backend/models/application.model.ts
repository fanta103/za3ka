import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type ApplicationStatus = "applied" | "screening" | "interview" | "offered" | "rejected" | "withdrawn";

export interface IApplicationDoc extends Document {
	_id: Types.ObjectId;
	jobId: Types.ObjectId | any;
	applicantId: Types.ObjectId | any;
	recruiterId: Types.ObjectId | any;
	status: ApplicationStatus;
	coverLetter?: string;
	resumeUrl?: string;
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
}

const applicationSchema = new Schema<IApplicationDoc>(
	{
		jobId: {
			type: Schema.Types.ObjectId,
			ref: "Job",
			required: true,
			index: true,
		},
		applicantId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		recruiterId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		status: {
			type: String,
			enum: ["applied", "screening", "interview", "offered", "rejected", "withdrawn"],
			default: "applied",
		},
		coverLetter: {
			type: String,
			maxlength: 3000,
		},
		resumeUrl: {
			type: String,
		},
		notes: {
			type: String,
		},
	},
	{ timestamps: true }
);

// Compound unique index ensuring one application per user per job
applicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });
applicationSchema.index({ applicantId: 1, createdAt: -1 });
applicationSchema.index({ recruiterId: 1, status: 1, createdAt: -1 });

const Application: Model<IApplicationDoc> = mongoose.model<IApplicationDoc>("Application", applicationSchema);

export default Application;
