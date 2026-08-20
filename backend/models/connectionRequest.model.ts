import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IConnectionRequest extends Document {
	_id: Types.ObjectId;
	sender: Types.ObjectId | any;
	recipient: Types.ObjectId | any;
	status: "pending" | "accepted" | "rejected";
	createdAt: Date;
	updatedAt: Date;
}

const connectionRequestSchema = new Schema<IConnectionRequest>(
	{
		sender: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		recipient: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		status: {
			type: String,
			enum: ["pending", "accepted", "rejected"],
			default: "pending",
		},
	},
	{ timestamps: true }
);

// Compound index for fast lookup of connection requests between two users
connectionRequestSchema.index({ sender: 1, recipient: 1 });
connectionRequestSchema.index({ recipient: 1, status: 1 });

const ConnectionRequest: Model<IConnectionRequest> = mongoose.model<IConnectionRequest>(
	"ConnectionRequest",
	connectionRequestSchema
);

export default ConnectionRequest;
