import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
	try {
		if (process.env.MONGO_URI) {
			const conn = await mongoose.connect(process.env.MONGO_URI);
			console.log(`MongoDB connected: ${conn.connection.host}`);
			return;
		}
		throw new Error("MONGO_URI not provided");
	} catch (error: any) {
		console.warn(`Could not connect to MongoDB URI (${error.message}). Starting in-memory MongoDB...`);
		try {
			const { MongoMemoryServer } = await import("mongodb-memory-server");
			const mongod = await MongoMemoryServer.create();
			const uri = mongod.getUri();
			await mongoose.connect(uri);
			console.log(`In-memory MongoDB connected successfully at: ${uri}`);
		} catch (memError: any) {
			console.error(`Error starting in-memory MongoDB: ${memError.message}`);
			process.exit(1);
		}
	}
};
