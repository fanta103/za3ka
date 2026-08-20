import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IMessageDoc extends Document {
	_id: Types.ObjectId;
	conversationId: Types.ObjectId;
	senderId: Types.ObjectId | any;
	text?: string;
	image?: string;
	readBy: Types.ObjectId[];
	createdAt: Date;
	updatedAt: Date;
}

const messageSchema = new Schema<IMessageDoc>(
	{
		conversationId: {
			type: Schema.Types.ObjectId,
			ref: "Conversation",
			required: true,
			index: true,
		},
		senderId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		text: {
			type: String,
			trim: true,
			maxlength: 2000,
		},
		image: {
			type: String,
		},
		readBy: [
			{
				type: Schema.Types.ObjectId,
				ref: "User",
			},
		],
	},
	{ timestamps: true }
);

// Compound index for chronologically fetching messages within a conversation
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message: Model<IMessageDoc> = mongoose.model<IMessageDoc>("Message", messageSchema);

export default Message;
