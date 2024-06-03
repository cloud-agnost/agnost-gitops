import config from "config";
import mongoose from "mongoose";

export const connectToDatabase = async () => {
	try {
		mongoose.set("strictQuery", false);
		await mongoose.connect(process.env.CLUSTER_DB_URI, {
			user: process.env.CLUSTER_DB_USER,
			pass: process.env.CLUSTER_DB_PWD,
			maxPoolSize: config.get("database.maxPoolSize"),
		});

		console.info(`Connected to the database @${process.env.CLUSTER_DB_URI}`);
	} catch (err) {
		console.error(`Cannot connect to the database`, { details: err });
		process.exit(1);
	}
};

export const disconnectFromDatabase = async () => {
	await mongoose.disconnect();
	console.info("Disconnected from the database");
};
