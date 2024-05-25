import { axios } from '@/helpers';
import {
	Cache,
	CreateCacheParams,
	DeleteCacheParams,
	DeleteMultipleCachesParams,
	GetCacheByIdParams,
	GetCachesOfAppVersionParams,
	UpdateCacheParams,
} from '@/types/cache';

export default class CacheService {
	static url = '/v1/org';

	static async getCaches({ orgId, appId, versionId, ...params }: GetCachesOfAppVersionParams) {
		return (
			await axios.get(`${this.url}/${orgId}/app/${appId}/version/${versionId}/cache`, {
				params,
			})
		).data;
	}
	static async getCacheById({
		orgId,
		appId,
		versionId,
		cacheId,
		...params
	}: GetCacheByIdParams): Promise<Cache> {
		return (
			await axios.get(`${this.url}/${orgId}/app/${appId}/version/${versionId}/cache/${cacheId}`, {
				params,
			})
		).data;
	}
	static async createCache({
		orgId,
		appId,
		versionId,
		...data
	}: CreateCacheParams): Promise<Cache> {
		return (await axios.post(`${this.url}/${orgId}/app/${appId}/version/${versionId}/cache`, data))
			.data;
	}
	static async updateCache({
		orgId,
		appId,
		versionId,
		cacheId,
		...data
	}: UpdateCacheParams): Promise<Cache> {
		return (
			await axios.put(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/cache/${cacheId}`,
				data,
			)
		).data;
	}
	static async deleteCache({ orgId, appId, versionId, cacheId }: DeleteCacheParams): Promise<void> {
		return (
			await axios.delete(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/cache/${cacheId}`,
				{
					data: {},
				},
			)
		).data;
	}
	static async deleteMultipleCaches({
		orgId,
		appId,
		versionId,
		...data
	}: DeleteMultipleCachesParams): Promise<void> {
		return (
			await axios.delete(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/cache/delete-multi`,
				{ data },
			)
		).data;
	}
}
