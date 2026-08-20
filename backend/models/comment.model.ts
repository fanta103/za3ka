import mongoose, { Document, Model, Schema, Types, CallbackError } from "mongoose";

export interface ICommentDoc extends Document {
	_id: Types.ObjectId;
	postId: Types.ObjectId;
	authorId: Types.ObjectId | any;
	content: string;
	deletedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
	softDelete(): Promise<ICommentDoc>;
}

const commentSchema = new Schema<ICommentDoc>(
	{
		postId: {
			type: Schema.Types.ObjectId,
			ref: "Post",
			required: true,
			index: true,
		},
		authorId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		content: {
			type: String,
			required: true,
			trim: true,
			maxlength: 1000,
		},
		deletedAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true }
);

// Compound index for querying comments by post chronologically
commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ postId: 1, deletedAt: 1, createdAt: 1 });

// Soft delete pre-query middleware
const excludeSoftDeleted = function (this: any, next: (err?: CallbackError) => void) {
	if (this.getFilter().deletedAt === undefined) {
		this.where({ deletedAt: null });
	}
	next();
};

commentSchema.pre("find", excludeSoftDeleted);
commentSchema.pre("findOne", excludeSoftDeleted);
commentSchema.pre("countDocuments", excludeSoftDeleted);
commentSchema.pre("findOneAndUpdate", excludeSoftDeleted);

// Instance method for soft delete
commentSchema.methods.softDelete = function (this: ICommentDoc) {
	this.deletedAt = new Date();
	return this.save();
};

const Comment: Model<ICommentDoc> = mongoose.model<ICommentDoc>("Comment", commentSchema);

export default Comment;
