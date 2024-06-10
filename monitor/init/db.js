import config from "config";
import mongo from "mongodb";

//MongoDB client
var client;

export const connectToDatabase = async () => {
	try {
		client = new mongo.MongoClient(process.env.CLUSTER_DB_URI, {
			maxPoolSize: config.get("database.maxPoolSize"),
			auth: {
				username: process.env.CLUSTER_DB_USER,
				password: process.env.CLUSTER_DB_PWD,
			},
		});
		//Connect to the database of the application
		await client.connect();
		console.info(`Connected to the database ${process.env.CLUSTER_DB_URI}`);
	} catch (err) {
		console.error(`Cannot connect to the database. ${err}`);
		process.exit(1);
	}
};

export const disconnectFromDatabase = async () => {
	await client.close();
	console.info("Disconnected from the database");
};

export const getDBClient = () => {
	return client;
};
