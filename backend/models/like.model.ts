import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ILikeDoc extends Document {
	_id: Types.ObjectId;
	userId: Types.ObjectId;
	postId: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const likeSchema = new Schema<ILikeDoc>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		postId: {
			type: Schema.Types.ObjectId,
			ref: "Post",
			required: true,
		},
	},
	{ timestamps: true }
);

// Compound unique index ensuring one like per user per post
likeSchema.index({ postId: 1, userId: 1 }, { unique: true });

const Like: Model<ILikeDoc> = mongoose.model<ILikeDoc>("Like", likeSchema);

export default Like;
