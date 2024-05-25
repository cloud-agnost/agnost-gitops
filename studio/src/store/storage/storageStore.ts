import StorageService from '@/services/StorageService';
import {
	APIError,
	Bucket,
	BucketCountInfo,
	BucketFile,
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
	Storage,
	UpdateBucketParams,
	UpdateFileInBucketParams,
	UpdateStorageParams,
	UploadFileToBucketParams,
} from '@/types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import useVersionStore from '../version/versionStore';
export interface StorageStore {
	storages: Storage[];
	workspaceStorages: Storage[];
	storage: Storage;
	bucket: Bucket;
	buckets: Bucket[];
	files: {
		[bckId: string]: BucketFile[];
	};
	file: BucketFile;
	fileCountInfo:
		| {
				[bckId: string]: BucketCountInfo | undefined;
		  }
		| undefined;
	lastFetchedPage: number | undefined;
	toDeleteStorage: Storage | null;
	isStorageDeleteDialogOpen: boolean;
	isEditFileDialogOpen: boolean;
	isEditStorageDialogOpen: boolean;
	isEditBucketDialogOpen: boolean;
	isBucketDeleteDialogOpen: boolean;
	toDeleteBucket: Bucket | null;
	bucketCountInfo: BucketCountInfo | undefined;
	uploadProgress: number;
	isCreateStorageModalOpen: boolean;
}

type Actions = {
	openDeleteStorageModal: (storage: Storage) => void;
	closeDeleteStorageModal: () => void;
	openDeleteBucketDialog: (bucket: Bucket) => void;
	closeBucketDeleteDialog: () => void;
	openEditBucketDialog: (bucket: Bucket) => void;
	closeEditBucketDialog: () => void;
	openEditStorageModal: (storage: Storage) => void;
	openFileEditDialog: (file: BucketFile) => void;
	closeFileEditDialog: () => void;
	closeEditStorageModal: () => void;
	createStorage: (storage: CreateStorageParams) => Promise<Storage>;
	getStorageById: (storage: GetStorageByIdParams) => Promise<Storage>;
	getStorages: (storage: GetStoragesParams) => Promise<Storage[]>;
	deleteStorage: (storage: DeleteStorageParams) => Promise<void>;
	deleteMultipleStorages: (storage: DeleteMultipleStoragesParams) => Promise<void>;
	updateStorage: (storage: UpdateStorageParams) => Promise<Storage>;
	getBuckets: (req: GetStorageBuckets) => Promise<Bucket[]>;
	getBucket: (req: DeleteBucketParams) => Promise<Bucket>;
	createBucket: (req: CreateBucketParams) => Promise<Bucket>;
	deleteBucket: (req: DeleteBucketParams) => Promise<void>;
	emptyBucket: (req: DeleteBucketParams) => Promise<void>;
	deleteMultipleBuckets: (req: DeleteMultipleBucketParams) => Promise<void>;
	updateBucket: (req: UpdateBucketParams) => Promise<Bucket>;
	getFilesOfBucket: (req: GetFilesParams) => Promise<BucketFile[]>;
	uploadFileToBucket: (req: UploadFileToBucketParams) => Promise<BucketFile[]>;
	deleteFileFromBucket: (req: DeleteFileFromBucketParams) => Promise<void>;
	deleteMultipleFileFromBucket: (req: DeleteMultipleFilesFromBucketParams) => Promise<void>;
	replaceFileInBucket: (req: ReplaceFileInBucket) => Promise<BucketFile>;
	copyFileInBucket: (req: DeleteFileFromBucketParams) => Promise<BucketFile>;
	updateFileInBucket: (req: UpdateFileInBucketParams) => Promise<BucketFile>;
	toggleCreateModal: () => void;
	reset: () => void;
};

const initialState: StorageStore = {
	storages: [],
	workspaceStorages: [],
	storage: {} as Storage,
	bucket: {} as Bucket,
	buckets: [],
	bucketCountInfo: undefined,
	lastFetchedPage: undefined,
	toDeleteStorage: null,
	isStorageDeleteDialogOpen: false,
	isEditStorageDialogOpen: false,
	isEditBucketDialogOpen: false,
	isBucketDeleteDialogOpen: false,
	toDeleteBucket: null,
	files: {},
	file: {} as BucketFile,
	fileCountInfo: undefined,
	uploadProgress: 0,
	isEditFileDialogOpen: false,
	isCreateStorageModalOpen: false,
};

const useStorageStore = create<StorageStore & Actions>()(
	devtools((set, get) => ({
		...initialState,
		openDeleteStorageModal: (storage: Storage) => {
			set({ toDeleteStorage: storage, isStorageDeleteDialogOpen: true });
		},
		closeDeleteStorageModal: () => {
			set({ toDeleteStorage: null, isStorageDeleteDialogOpen: false });
		},
		openDeleteBucketDialog: (bucket: Bucket) => {
			set({ toDeleteBucket: bucket, isBucketDeleteDialogOpen: true });
		},
		closeBucketDeleteDialog: () => {
			set({ toDeleteBucket: null, isBucketDeleteDialogOpen: false });
		},
		createStorage: async (params: CreateStorageParams) => {
			try {
				const createdStorage = await StorageService.createStorage(params);
				set({
					storages: [createdStorage, ...get().storages],
					workspaceStorages: [createdStorage, ...get().workspaceStorages],
				});
				params.onSuccess?.();
				useVersionStore.setState?.((state) => ({
					dashboard: {
						...state.dashboard,
						storage: state.dashboard.storage + 1,
					},
				}));
				return createdStorage;
			} catch (error) {
				params.onError?.(error as APIError);
				throw error as APIError;
			}
		},
		getStorageById: async (params: GetStorageByIdParams) => {
			const storage = await StorageService.getStorage(params);
			set({ storage });
			return storage;
		},
		getStorages: async (params: GetStoragesParams) => {
			const storages = await StorageService.getStorages(params);
			if (params.workspace) {
				set({ workspaceStorages: storages });
				return storages;
			}

			if (params.page === 0) {
				set({ storages, lastFetchedPage: params.page });
			} else {
				set((prev) => ({
					storages: [...prev.storages, ...storages],
					lastFetchedPage: params.page,
				}));
			}

			return storages;
		},
		deleteStorage: async (params: DeleteStorageParams) => {
			try {
				await StorageService.deleteStorage(params);
				set({
					storages: get().storages.filter((storage) => storage._id !== params.storageId),
					workspaceStorages: get().workspaceStorages.filter(
						(storage) => storage._id !== params.storageId,
					),
				});

				params.onSuccess?.();
			} catch (error) {
				params.onError?.(error as APIError);
				throw error as APIError;
			}
		},
		deleteMultipleStorages: async (params: DeleteMultipleStoragesParams) => {
			try {
				await StorageService.deleteMultipleStorage(params);
				set({
					storages: get().storages.filter((storage) => !params.storageIds.includes(storage._id)),
					workspaceStorages: get().workspaceStorages.filter(
						(storage) => !params.storageIds.includes(storage._id),
					),
				});

				params.onSuccess?.();
			} catch (error) {
				params.onError?.(error as APIError);
				throw error as APIError;
			}
		},
		updateStorage: async (params: UpdateStorageParams) => {
			try {
				const updatedStorage = await StorageService.updateStorage(params);
				set((state) => ({
					storages: state.storages.map((storage) =>
						storage._id === updatedStorage._id ? updatedStorage : storage,
					),
					workspaceStorages: state.workspaceStorages.map((storage) =>
						storage._id === updatedStorage._id ? updatedStorage : storage,
					),
					storage: updatedStorage._id === state.storage._id ? updatedStorage : state.storage,
				}));
				params.onSuccess?.();
				return updatedStorage;
			} catch (error) {
				params.onError?.(error as APIError);
				throw error as APIError;
			}
		},
		openEditStorageModal: (storage: Storage) => {
			set({ storage, isEditStorageDialogOpen: true });
		},
		closeEditStorageModal: () => {
			set({ storage: {} as Storage, isEditStorageDialogOpen: false });
		},
		openEditBucketDialog: (bucket: Bucket) => {
			set({ bucket, isEditBucketDialogOpen: true });
		},
		closeEditBucketDialog: () => {
			set({ bucket: {} as Bucket, isEditBucketDialogOpen: false });
		},
		openFileEditDialog: (file: BucketFile) => {
			set({ file, isEditFileDialogOpen: true });
		},
		closeFileEditDialog: () => {
			set({ file: {} as BucketFile, isEditFileDialogOpen: false });
		},
		getBuckets: async (params: GetStorageBuckets) => {
			const buckets = await StorageService.getStorageBuckets(params);
			set({ buckets: buckets.data, bucketCountInfo: buckets.info });
			return buckets.data;
		},
		getBucket: async (params: DeleteBucketParams) => {
			const bucket = await StorageService.getBucket(params);
			set({ bucket });
			return bucket;
		},
		createBucket: async (params: CreateBucketParams) => {
			try {
				const createdBucket = await StorageService.createBucket(params);
				set((state) => ({
					buckets: [createdBucket, ...get().buckets].sort((a, b) => a.name.localeCompare(b.name)),
					bucketCountInfo: {
						...state.bucketCountInfo,
						count: (state.bucketCountInfo?.count ?? 0) + 1,
						totalCount: (state.bucketCountInfo?.totalCount ?? 0) + 1,
						currentPage: state.bucketCountInfo?.currentPage ?? 1,
						pageSize: state.bucketCountInfo?.pageSize ?? 1,
						totalPages: state.bucketCountInfo?.totalPages ?? 1,
					},
				}));
				params.onSuccess?.();
				return createdBucket;
			} catch (error) {
				params.onError?.(error as APIError);
				throw error as APIError;
			}
		},
		deleteBucket: async (params: DeleteBucketParams) => {
			try {
				await StorageService.deleteBucket(params);
				set({
					buckets: get().buckets.filter((bucket) => bucket.name !== params.bucketName),
				});
				params.onSuccess?.();
			} catch (error) {
				params.onError?.(error as APIError);
				throw error as APIError;
			}
		},
		emptyBucket: async (params: DeleteBucketParams) => {
			try {
				await StorageService.emptyBucket(params);
				if (params.bckId) {
					set({
						files: { ...get().files, [params.bckId]: [] },
						fileCountInfo: { ...get().fileCountInfo, [params.bckId]: undefined },
					});
				}
				params.onSuccess?.();
			} catch (error) {
				params.onError?.(error as APIError);
				throw error as APIError;
			}
		},
		deleteMultipleBuckets: async (params: DeleteMultipleBucketParams) => {
			try {
				await StorageService.deleteMultipleBuckets(params);
				set({
					buckets: get().buckets.filter(
						(bucket) => !params.deletedBuckets.find((bck) => bck.name === bucket.name),
					),
				});
				params.onSuccess?.();
			} catch (error) {
				params.onError?.(error as APIError);
				throw error as APIError;
			}
		},
		updateBucket: async (params: UpdateBucketParams) => {
			try {
				const bucket = await StorageService.updateBucket(params);
				set((prev) => ({
					buckets: prev.buckets
						.map((b) => (b.id === bucket.id ? bucket : b))
						.sort((a, b) => a.name.localeCompare(b.name)),
					bucket,
				}));
				params.onSuccess?.();
				return bucket;
			} catch (error) {
				params.onError?.(error as APIError);
				throw error as APIError;
			}
		},
		getFilesOfBucket: async (params: GetFilesParams) => {
			const files = await StorageService.getFilesOfBucket(params);
			set((state) => ({
				files: { ...state.files, [params.bckId]: files.data },
				fileCountInfo: { ...state.fileCountInfo, [params.bckId]: files.info },
			}));
			return files.data;
		},
		uploadFileToBucket: async (params: UploadFileToBucketParams) => {
			try {
				const newFiles = await StorageService.uploadFileToBucket(params);

				set((state) => ({
					files: { ...state.files, [params.bckId]: [...newFiles, ...state.files[params.bckId]] },
					fileCountInfo: {
						...state.fileCountInfo,
						[params.bckId]: {
							...state.fileCountInfo?.[params.bckId],
							count: (state.fileCountInfo?.[params.bckId]?.count ?? 0) + params.files.length,
							totalCount:
								(state.fileCountInfo?.[params.bckId]?.totalCount ?? 0) + params.files.length,
							currentPage: state.fileCountInfo?.[params.bckId]?.currentPage ?? 1,
							pageSize: state.fileCountInfo?.[params.bckId]?.pageSize ?? 1,
							totalPages: state.fileCountInfo?.[params.bckId]?.totalPages ?? 1,
						},
					},
				}));
				params.onSuccess?.();
				return newFiles;
			} catch (error) {
				params.onError?.(error as APIError);
				throw error as APIError;
			}
		},
		deleteFileFromBucket: async (params: DeleteFileFromBucketParams) => {
			try {
				await StorageService.deleteFileFromBucket(params);
				set((state) => ({
					files: {
						...state.files,
						[params.bckId]: state.files[params.bckId].filter(
							(file) => file.path !== params.filePath,
						),
					},
				}));
				params.onSuccess?.();
			} catch (error) {
				params.onError?.(error as APIError);
				throw error as APIError;
			}
		},
		deleteMultipleFileFromBucket: async (params: DeleteMultipleFilesFromBucketParams) => {
			try {
				await StorageService.deleteMultipleFilesFromBucket(params);
				set((state) => ({
					files: {
						...state.files,
						[params.bckId]: state.files[params.bckId].filter(
							(file) => !params.filePaths.includes(file.path),
						),
					},
				}));
				params.onSuccess?.();
			} catch (error) {
				params.onError?.(error as APIError);
				throw error as APIError;
			}
		},
		replaceFileInBucket: async (params: ReplaceFileInBucket) => {
			try {
				const file = await StorageService.replaceFileInBucket(params);
				set((state) => ({
					files: {
						...state.files,
						[params.bckId]: state.files[params.bckId].map((f) => (f.path === file.path ? file : f)),
					},
					file,
				}));
				params.onSuccess?.();
				return file;
			} catch (error) {
				params.onError?.(error as APIError);
				throw error as APIError;
			}
		},
		copyFileInBucket: async (params: DeleteFileFromBucketParams) => {
			try {
				const file = await StorageService.copyFileInBucket(params);
				set((state) => ({
					files: { ...state.files, [params.bckId]: [file, ...state.files[params.bckId]] },
					file,
				}));
				params.onSuccess?.();
				return file;
			} catch (error) {
				params.onError?.(error as APIError);
				throw error as APIError;
			}
		},
		updateFileInBucket: async (params: UpdateFileInBucketParams) => {
			try {
				const file = await StorageService.updateFileInBucket(params);
				set((state) => ({
					files: {
						...state.files,
						[params.bckId]: state.files[params.bckId].map((f) => (f.path === file.path ? file : f)),
					},
					file,
				}));
				params.onSuccess?.();
				return file;
			} catch (error) {
				params.onError?.(error as APIError);
				throw error as APIError;
			}
		},
		toggleCreateModal: () => {
			set((prev) => ({ isCreateStorageModalOpen: !prev.isCreateStorageModalOpen }));
		},
		reset: () => set(initialState),
	})),
);

export default useStorageStore;
