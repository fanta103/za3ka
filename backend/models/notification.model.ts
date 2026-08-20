import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface INotification extends Document {
	_id: Types.ObjectId;
	recipient: Types.ObjectId | any;
	type:
		| "like"
		| "comment"
		| "connectionAccepted"
		| "jobApplication"
		| "applicationStatus"
		| "interviewScheduled"
		| "interviewStatusChanged"
		| "interviewFeedback";
	relatedUser?: Types.ObjectId | any;
	relatedPost?: Types.ObjectId | any;
	relatedInterview?: Types.ObjectId | any;
	read: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
	{
		recipient: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		type: {
			type: String,
			required: true,
			enum: [
				"like",
				"comment",
				"connectionAccepted",
				"jobApplication",
				"applicationStatus",
				"interviewScheduled",
				"interviewStatusChanged",
				"interviewFeedback",
			],
		},
		relatedUser: {
			type: Schema.Types.ObjectId,
			ref: "User",
		},
		relatedPost: {
			type: Schema.Types.ObjectId,
			ref: "Post",
		},
		relatedInterview: {
			type: Schema.Types.ObjectId,
			ref: "InterviewSession",
		},
		read: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

// Compound index for querying a user's notifications sorted by date/read status
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification: Model<INotification> = mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;

