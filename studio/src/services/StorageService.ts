import { axios, http } from '@/helpers';
import useEnvironmentStore from '@/store/environment/environmentStore';
import useStorageStore from '@/store/storage/storageStore';
import {
	Bucket,
	BucketFile,
	BucketFileWithCountInfo,
	BucketWithCountInfo,
	CreateBucketParams,
	CreateStorageParams,
	DeleteBucketParams,
	DeleteFileFromBucketParams,
	DeleteMultipleBucketParams,
	DeleteMultipleFilesFromBucketParams,
	DeleteMultipleStoragesParams,
	DeleteStorageParams,
	GetFilesParams,
	GetStorageBuckets,
	GetStorageByIdParams,
	GetStoragesParams,
	ReplaceFileInBucket,
	UpdateBucketParams,
	UpdateFileInBucketParams,
	UpdateStorageParams,
	UploadFileToBucketParams,
} from '@/types';
export default class StorageService {
	static url = 'v1/org/';

	static getUrl() {
		return `${useEnvironmentStore.getState().environment?.iid}/agnost`;
	}

	static async getStorages({ orgId, appId, versionId, ...params }: GetStoragesParams) {
		return (
			await axios.get(`${this.url}${orgId}/app/${appId}/version/${versionId}/storage`, {
				params,
			})
		).data;
	}

	static async getStorage({ orgId, appId, versionId, storageId }: GetStorageByIdParams) {
		return (
			await axios.get(`${this.url}${orgId}/app/${appId}/version/${versionId}/storage/${storageId}`)
		).data;
	}
	static async createStorage({ orgId, appId, versionId, ...data }: CreateStorageParams) {
		return (await axios.post(`${this.url}${orgId}/app/${appId}/version/${versionId}/storage`, data))
			.data;
	}

	static async updateStorage({ orgId, appId, versionId, storageId, ...data }: UpdateStorageParams) {
		return (
			await axios.put(
				`${this.url}${orgId}/app/${appId}/version/${versionId}/storage/${storageId}`,
				data,
			)
		).data;
	}

	static async deleteStorage({ orgId, appId, versionId, storageId }: DeleteStorageParams) {
		return (
			await axios.delete(
				`${this.url}${orgId}/app/${appId}/version/${versionId}/storage/${storageId}`,
			)
		).data;
	}

	static async deleteMultipleStorage({
		orgId,
		appId,
		versionId,
		storageIds,
	}: DeleteMultipleStoragesParams) {
		return (
			await axios.delete(
				`${this.url}${orgId}/app/${appId}/version/${versionId}/storage/delete-multi`,
				{ data: { storageIds } },
			)
		).data;
	}

	static async getStorageBuckets({
		storageName,
		filter,
		...params
	}: GetStorageBuckets): Promise<BucketWithCountInfo> {
		return (
			await http.post(
				`${this.getUrl()}/storage/${storageName}/get-buckets`,
				{ filter },
				{
					params,
				},
			)
		).data;
	}

	static async createBucket({ storageName, ...data }: CreateBucketParams): Promise<Bucket> {
		return (await http.post(`${this.getUrl()}/storage/${storageName}/bucket`, data)).data;
	}

	static async deleteBucket({
		storageName,
		bucketName,
		versionId,
	}: DeleteBucketParams): Promise<void> {
		return (
			await http.delete(`${this.getUrl()}/storage/${storageName}/bucket/${bucketName}`, {
				params: { versionId },
			})
		).data;
	}
	static async getBucket({ storageName, bucketName }: DeleteBucketParams): Promise<Bucket> {
		return (await http.get(`${this.getUrl()}/storage/${storageName}/bucket/${bucketName}`)).data;
	}

	static async emptyBucket({ storageName, bucketName }: DeleteBucketParams): Promise<void> {
		return (
			await http.delete(`${this.getUrl()}/storage/${storageName}/bucket/${bucketName}/empty`, {
				data: { name: bucketName },
			})
		).data;
	}

	static async deleteMultipleBuckets({
		storageName,
		deletedBuckets,
		versionId,
	}: DeleteMultipleBucketParams): Promise<void> {
		return (
			await http.delete(`${this.getUrl()}/storage/${storageName}/delete-multi-buckets`, {
				data: { deletedBuckets, versionId },
			})
		).data;
	}

	static async updateBucket({
		storageName,
		bucketName,
		...data
	}: UpdateBucketParams): Promise<Bucket> {
		return (await http.put(`${this.getUrl()}/storage/${storageName}/bucket/${bucketName}`, data))
			.data;
	}

	static async getFilesOfBucket({
		storageName,
		bucketName,
		filter,
		...params
	}: GetFilesParams): Promise<BucketFileWithCountInfo> {
		return (
			await http.post(
				`${this.getUrl()}/storage/${storageName}/bucket/${bucketName}/get-files`,
				{ filter },
				{
					params,
				},
			)
		).data;
	}

	static async uploadFileToBucket({
		storageName,
		bucketName,
		...data
	}: UploadFileToBucketParams): Promise<BucketFile[]> {
		const formData = new FormData();
		for (const file of data.files) {
			formData.append('file', file);
		}

		return (
			await http.post(
				`${this.getUrl()}/storage/${storageName}/bucket/${bucketName}/file`,
				formData,
				{
					headers: {
						'Content-Type': 'multipart/form-data',
					},
					onUploadProgress: (progressEvent) => {
						const uploadProgress = Math.round(
							(progressEvent.loaded * 100) / Number(progressEvent.total),
						);
						useStorageStore.setState({ uploadProgress });
					},
				},
			)
		).data;
	}

	static async deleteFileFromBucket({
		storageName,
		bucketName,
		filePath,
	}: DeleteFileFromBucketParams): Promise<void> {
		return (
			await http.delete(`${this.getUrl()}/storage/${storageName}/bucket/${bucketName}/file`, {
				data: { filePath },
			})
		).data;
	}

	static async deleteMultipleFilesFromBucket({
		storageName,
		bucketName,
		filePaths,
	}: DeleteMultipleFilesFromBucketParams): Promise<void> {
		return (
			await http.delete(
				`${this.getUrl()}/storage/${storageName}/bucket/${bucketName}/file/delete-multi`,
				{
					data: { filePaths },
				},
			)
		).data;
	}

	static async replaceFileInBucket({
		storageName,
		bucketName,
		filePath,
		...data
	}: ReplaceFileInBucket): Promise<BucketFile> {
		const formData = new FormData();
		formData.append('file', data.file);
		formData.append('filePath', filePath);
		return (
			await http.put(
				`${this.getUrl()}/storage/${storageName}/bucket/${bucketName}/file/replace`,
				formData,
				{
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				},
			)
		).data;
	}

	static async copyFileInBucket({
		storageName,
		bucketName,
		filePath,
	}: DeleteFileFromBucketParams): Promise<BucketFile> {
		return (
			await http.put(`${this.getUrl()}/storage/${storageName}/bucket/${bucketName}/file/copy`, {
				filePath,
			})
		).data;
	}

	static async updateFileInBucket({
		storageName,
		bucketName,
		...data
	}: UpdateFileInBucketParams): Promise<BucketFile> {
		return (
			await http.put(`${this.getUrl()}/storage/${storageName}/bucket/${bucketName}/file`, data)
		).data;
	}

	static async downloadFileFromBucket(fileId: string): Promise<void> {
		return (
			await http.get(`${this.getUrl()}/object/${fileId}?attachment=true`, {
				responseType: 'blob',
			})
		).data;
	}
}
