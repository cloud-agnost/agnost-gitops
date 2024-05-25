import { NAME_REGEX, NOT_START_WITH_NUMBER_REGEX } from '@/constants/regex';
import { translate } from '@/utils';
import * as z from 'zod';
import { StorageNameSchema } from './schema';
import { BaseGetRequest, BaseParams, BaseRequest } from './type';
export interface Storage {
	_id: string;
	orgId: string;
	appId: string;
	versionId: string;
	iid: string;
	name: string;
	createdBy: string;
	updatedBy: string;
	createdAt: string;
	updatedAt: string;
}

export interface Bucket {
	_id: string;
	id: string;
	storageId: string;
	name: string;
	isPublic: boolean;
	createdAt: string;
	updatedAt: string;
	tags: Record<string, string>;
	userId: string;
}

export interface BucketFile {
	id: string;
	storageId: string;
	bucketId: string;
	path: string;
	size: number;
	mimeType: string;
	uploadedAt: string;
	updatedAt: string;
	isPublic: boolean;
	tags: Record<string, string>;
}

export interface BucketWithCountInfo {
	data: Bucket[];
	info: BucketCountInfo;
}

export interface BucketFileWithCountInfo {
	data: BucketFile[];
	info: BucketCountInfo;
}
export interface BucketCountInfo {
	count: number;
	currentPage: number;
	pageSize: number;
	totalPages: number;
	totalCount: number;
}
export interface CreateStorageParams extends BaseParams, BaseRequest {
	name: string;
	resourceId: string;
}

export type GetStoragesParams = BaseParams &
	BaseGetRequest & {
		workspace?: string;
	};

export interface GetStorageByIdParams extends BaseParams {
	storageId: string;
}

export interface UpdateStorageParams extends Omit<CreateStorageParams, 'resourceId'> {
	storageId: string;
}
export interface DeleteStorageParams extends BaseRequest, BaseParams {
	storageId: string;
}
export interface DeleteMultipleStoragesParams extends BaseRequest, BaseParams {
	storageIds: string[];
}
export interface GetStorageBuckets extends BaseGetRequest {
	storageName: string;
	returnCountInfo: boolean;
	filter: any;
}

export interface GetFilesParams extends BaseGetRequest {
	bckId: string;
	storageName: string;
	bucketName: string;
	returnCountInfo: boolean;
	limit: number;
	filter: any;
}
export interface DeleteBucketParams extends BaseRequest {
	storageName: string;
	bucketName: string;
	versionId?: string;
	bckId?: string;
}
export interface DeleteMultipleBucketParams extends BaseRequest {
	storageName: string;
	deletedBuckets: {
		id: string;
		name: string;
	}[];
	versionId: string;
}
export interface CreateBucketParams extends BaseRequest {
	storageName: string;
	name: string;
	isPublic?: boolean;
	tags?: Record<string, string>;
	versionId?: string;
}

export interface UpdateBucketParams extends BaseRequest, CreateBucketParams {
	bucketName: string;
}

export interface UploadFileToBucketParams extends BaseRequest {
	bckId: string;
	storageName: string;
	bucketName: string;
	files: FileList;
	userId?: string;
	upsert?: boolean;
	isPublic?: boolean;
}
export interface UpdateFileInBucketParams extends BaseRequest {
	bckId: string;
	storageName: string;
	bucketName: string;
	tags?: Record<string, string>;
	isPublic?: boolean;
	filePath: string;
}
export interface ReplaceFileInBucket extends BaseRequest {
	bckId: string;
	storageName: string;
	bucketName: string;
	file: File;
	filePath: string;
}

export interface DeleteFileFromBucketParams extends BaseRequest {
	bckId: string;
	storageName: string;
	bucketName: string;
	filePath: string;
}
export interface DeleteMultipleFilesFromBucketParams extends BaseRequest {
	bckId: string;
	storageName: string;
	bucketName: string;
	filePaths: string[];
}

export const StorageSchema = z.object({
	name: StorageNameSchema,
});

export const CreateStorageSchema = StorageSchema.extend({
	resourceId: z.string({
		required_error: translate('forms.required', {
			label: translate('queue.create.resource.title'),
		}),
	}),
});
export const BucketSchema = z.object({
	name: StorageNameSchema,
	isPublic: z.boolean().default(true),
	tags: z
		.array(
			z
				.object({
					key: z.string().optional().or(z.literal('')),
					value: z.string().optional().or(z.literal('')),
				})
				.superRefine((val, ctx) => {
					const { key, value } = val;
					if (key && !value) {
						return ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: translate('forms.required', {
								label: translate('resources.database.key'),
							}),
						});
					}
					if (!key && value) {
						return ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: translate('forms.required', {
								label: translate('resources.database.value'),
							}),
						});
					}
				}),
		)
		.optional(),
});

export const FileSchema = z.object({
	path: z
		.string({
			required_error: translate('forms.required', {
				label: translate('storage.file.path'),
			}),
		})
		.nonempty()
		.regex(NAME_REGEX, {
			message: translate('forms.invalid', {
				label: translate('storage.file.path'),
			}),
		})
		.min(2, {
			message: translate('forms.min2.error', {
				label: translate('storage.file.path'),
			}),
		})
		.max(64, {
			message: translate('forms.max64.error', {
				label: translate('storage.file.path'),
			}),
		})
		.trim()
		.regex(NOT_START_WITH_NUMBER_REGEX, {
			message: translate('forms.notStartWithNumber', {
				label: translate('storage.file.path'),
			}),
		})
		.refine(
			(value) => value.trim().length > 0,
			translate('forms.required', {
				label: translate('storage.file.path'),
			}),
		)
		.refine((value) => !value.startsWith('_'), {
			message: translate('forms.notStartWithUnderscore', {
				label: translate('storage.file.path'),
			}),
		})
		.refine(
			(value) => value !== 'this',
			(value) => ({
				message: translate('forms.reservedKeyword', {
					keyword: value,
					label: translate('storage.file.path'),
				}),
			}),
		),
	isPublic: z.boolean().default(true),
	tags: z
		.array(
			z
				.object({
					key: z.string().optional().or(z.literal('')),
					value: z.string().optional().or(z.literal('')),
				})
				.superRefine((val, ctx) => {
					const { key, value } = val;
					if (key && !value) {
						return ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: translate('forms.required', {
								label: translate('resources.database.key'),
							}),
						});
					}
					if (!key && value) {
						return ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: translate('forms.required', {
								label: translate('resources.database.value'),
							}),
						});
					}
				}),
		)
		.optional(),
});
