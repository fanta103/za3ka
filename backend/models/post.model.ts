import mongoose, { Document, Model, Schema, Types, CallbackError } from "mongoose";

export interface IPostDoc extends Document {
	_id: Types.ObjectId;
	author: Types.ObjectId | any;
	content?: string;
	image?: string;
	deletedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
	softDelete(): Promise<IPostDoc>;
}

const postSchema = new Schema<IPostDoc>(
	{
		author: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		content: { type: String },
		image: { type: String },
		deletedAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true }
);

// Indexes
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ content: "text" });

// Soft delete pre-query middleware
const excludeSoftDeleted = function (this: any, next: (err?: CallbackError) => void) {
	if (this.getFilter().deletedAt === undefined) {
		this.where({ deletedAt: null });
	}
	next();
};

postSchema.pre("find", excludeSoftDeleted);
postSchema.pre("findOne", excludeSoftDeleted);
postSchema.pre("countDocuments", excludeSoftDeleted);
postSchema.pre("findOneAndUpdate", excludeSoftDeleted);

// Instance method for soft delete
postSchema.methods.softDelete = function (this: IPostDoc) {
	this.deletedAt = new Date();
	return this.save();
};

const Post: Model<IPostDoc> = mongoose.model<IPostDoc>("Post", postSchema);

export default Post;
