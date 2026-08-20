import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IUnreadCount {
	userId: Types.ObjectId;
	count: number;
}

export interface IConversationDoc extends Document {
	_id: Types.ObjectId;
	participants: Types.ObjectId[] | any[];
	lastMessage?: string;
	lastMessageAt?: Date;
	unreadCounts: IUnreadCount[];
	createdAt: Date;
	updatedAt: Date;
}

const conversationSchema = new Schema<IConversationDoc>(
	{
		participants: [
			{
				type: Schema.Types.ObjectId,
				ref: "User",
				required: true,
			},
		],
		lastMessage: {
			type: String,
		},
		lastMessageAt: {
			type: Date,
		},
		unreadCounts: [
			{
				userId: {
					type: Schema.Types.ObjectId,
					ref: "User",
					required: true,
				},
				count: {
					type: Number,
					default: 0,
				},
			},
		],
	},
	{ timestamps: true }
);

// Index on participants array for fast conversation retrieval between users
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

const Conversation: Model<IConversationDoc> = mongoose.model<IConversationDoc>("Conversation", conversationSchema);

export default Conversation;
