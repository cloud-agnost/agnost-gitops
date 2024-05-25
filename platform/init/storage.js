import * as Minio from "minio";

class Storage {
	constructor() {
		this.minioClient = new Minio.Client({
			endPoint: process.env.MINIO_ENDPOINT, // Kubernetes service name for MinIO
			port: parseInt(process.env.MINIO_PORT, 10), // MinIO service port (default: 9000)
			useSSL: false, // Whether to use SSL (default: false)
			accessKey: process.env.MINIO_ACCESS_KEY, // MinIO access key
			secretKey: process.env.MINIO_SECRET_KEY, // MinIO secret key
		});
	}

	/**
	 * Checks if a bucket exists or not. If not creates the bucket.
	 * @param  {string} bucketName The bucket name
	 */
	async ensureBucket(bucketName) {
		const exists = await this.minioClient.bucketExists(bucketName);
		if (!exists) {
			await this.minioClient.makeBucket(bucketName);
		}
	}

	/**
	 * Saves the contents of the file to the file path
	 * @param  {string} bucketName The bucket name
	 * @param  {string} fileName The file name
	 * @param  {Buffer} contents The contents of the file
	 * @param  {Object} metaData The metadata about the saved file e.g., content-type
	 */
	async saveFile(bucketName, fileName, contents, metaData) {
		await this.minioClient.putObject(
			bucketName,
			fileName,
			contents,
			undefined,
			metaData
		);
	}

	/**
	 * Deletes the file stored in bucket
	 * @param  {string} bucketName The bucket name
	 * @param  {string} fileName The file name
	 */
	async deleteFile(bucketName, fileName) {
		if (!fileName) return;
		await this.minioClient.removeObject(bucketName, fileName);
	}

	/**
	 * Returns the metadata of the stored file
	 * @param  {string} bucketName The bucket name
	 * @param  {string} fileName The file name
	 */
	async getFileStat(bucketName, fileName) {
		return await this.minioClient.statObject(bucketName, fileName);
	}

	/**
	 * Returns the content-type of the stored file
	 * @param  {string} bucketName The bucket name
	 * @param  {string} fileName The file name
	 */
	async getFileContentType(bucketName, fileName) {
		const stat = await this.minioClient.statObject(bucketName, fileName);
		return stat.metaData["content-type"];
	}

	/**
	 * Returns the file stream
	 * @param  {string} bucketName The bucket name
	 * @param  {string} fileName The file name
	 */
	async getFileStream(bucketName, fileName) {
		return await this.minioClient.getObject(bucketName, fileName);
	}
}

// Create the GCP storage instance
export const storage = new Storage();
