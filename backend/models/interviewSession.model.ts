import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type InterviewStatus = "scheduled" | "in-progress" | "completed" | "cancelled";

export interface IRecruiterFeedback {
	rating?: number;
	notes?: string;
}

export interface IInterviewSessionDoc extends Document {
	_id: Types.ObjectId;
	jobId: Types.ObjectId | any;
	candidateId: Types.ObjectId | any;
	recruiterId: Types.ObjectId | any;
	status: InterviewStatus;
	scheduledAt: Date;
	duration: number; // in minutes
	liveKitRoomName?: string;
	recordingUrl?: string;
	recruiterFeedback?: IRecruiterFeedback;
	createdAt: Date;
	updatedAt: Date;
}

const interviewSessionSchema = new Schema<IInterviewSessionDoc>(
	{
		jobId: {
			type: Schema.Types.ObjectId,
			ref: "Job",
			required: true,
			index: true,
		},
		candidateId: {
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
			enum: ["scheduled", "in-progress", "completed", "cancelled"],
			default: "scheduled",
		},
		scheduledAt: {
			type: Date,
			required: true,
		},
		duration: {
			type: Number,
			default: 30,
		},
		liveKitRoomName: {
			type: String,
			sparse: true,
		},
		recordingUrl: {
			type: String,
		},
		recruiterFeedback: {
			rating: {
				type: Number,
				min: 1,
				max: 5,
			},
			notes: {
				type: String,
			},
		},
	},
	{ timestamps: true }
);

// Compound indexes for querying interviews by candidate or recruiter and status
interviewSessionSchema.index({ candidateId: 1, status: 1 });
interviewSessionSchema.index({ recruiterId: 1, status: 1 });
interviewSessionSchema.index({ scheduledAt: 1 });

const InterviewSession: Model<IInterviewSessionDoc> = mongoose.model<IInterviewSessionDoc>(
	"InterviewSession",
	interviewSessionSchema
);

export default InterviewSession;
