import { translate } from '@/utils';
import * as z from 'zod';
import { StorageNameSchema } from './schema';
import { BaseGetRequest, BaseParams, BaseRequest } from './type';

export interface Cache {
	orgId: string;
	appId: string;
	versionId: string;
	iid: string;
	name: string;
	assignUniqueName: boolean;
	createdBy: string;
	updatedBy: string;
	_id: string;
	createdAt: string;
	updatedAt: string;
	__v: number;
}
export type GetCachesOfAppVersionParams = BaseParams &
	BaseGetRequest & {
		workspace?: boolean;
	};
export type GetCacheByIdParams = BaseParams & {
	cacheId: string;
};
export interface DeleteMultipleCachesParams extends BaseParams, BaseRequest {
	cacheIds: string[];
}
export type DeleteCacheParams = GetCacheByIdParams & BaseRequest;
export interface CreateCacheParams extends BaseParams, BaseRequest {
	name: string;
	assignUniqueName: boolean;
	resourceId: string;
}
export type UpdateCacheParams = GetCacheByIdParams & Partial<Cache> & BaseRequest;

export const CacheSchema = z.object({
	name: StorageNameSchema,
	assignUniqueName: z.boolean().default(true),
});
export const CreateCacheSchema = z.object({
	...CacheSchema.shape,
	resourceId: z.string({
		required_error: translate('forms.required', {
			label: translate('queue.create.resource.title'),
		}),
	}),
});
