import { axios } from '@/helpers';
import {
	AddExistingResourceRequest,
	CreateResourceRequest,
	DeleteResourceRequest,
	GetResourceRequest,
	GetResourcesRequest,
	Resource,
	RestartManagedResourceRequest,
	UpdateManagedResourceConfigurationRequest,
	UpdateResourceAccessSettingsRequest,
	UpdateResourceAllowedRolesRequest,
} from '@/types';
export default class ResourceService {
	static url = 'v1/org/:orgId/resource';

	static getUrl(orgId: string) {
		return this.url.replace(':orgId', orgId as string);
	}

	static async getResources(req: GetResourcesRequest): Promise<Resource[]> {
		const { instance, search, type, sortBy, sortDir } = req;
		return (
			await axios.get(`${this.getUrl(req.orgId)}`, {
				params: {
					instance,
					search,
					type,
					sortBy,
					sortDir,
				},
			})
		).data;
	}
	static async getResource(req: GetResourceRequest): Promise<Resource> {
		return (await axios.get(`${this.getUrl(req.orgId)}/iid/${req.iid}`)).data;
	}

	static async testExistingResourceConnection(req: AddExistingResourceRequest) {
		return (await axios.post(`${this.getUrl(req.orgId)}/test`, req)).data;
	}
	static async addExistingResource(req: AddExistingResourceRequest) {
		return (await axios.post(`${this.getUrl(req.orgId)}/add`, req)).data;
	}
	static async deleteResource(req: DeleteResourceRequest) {
		return (
			await axios.delete(`${this.getUrl(req.orgId)}/${req.resourceId}`, {
				data: { resourceId: req.resourceId },
			})
		).data;
	}

	static async createNewResource(req: CreateResourceRequest): Promise<Resource> {
		return (await axios.post(`${this.getUrl(req.orgId)}/create`, req)).data;
	}

	static async updateResourceAllowedRoles(
		req: UpdateResourceAllowedRolesRequest,
	): Promise<Resource> {
		return (await axios.put(`${this.getUrl(req.orgId)}/${req.resourceId}`, req)).data;
	}

	static async updateResourceAccessSettings(
		req: UpdateResourceAccessSettingsRequest,
	): Promise<Resource> {
		return (await axios.put(`${this.getUrl(req.orgId)}/${req.resourceId}/access`, req)).data;
	}
	static async updateManagedResourceConfiguration(
		req: UpdateManagedResourceConfigurationRequest,
	): Promise<Resource> {
		return (await axios.put(`${this.getUrl(req.orgId)}/${req.resourceId}/config`, req)).data;
	}

	static async getOrganizationResources(params: GetResourcesRequest) {
		return (
			await axios.get(`${this.getUrl(params.orgId)}/edit-list`, {
				params,
			})
		).data;
	}

	static async restartManagedResource(req: RestartManagedResourceRequest): Promise<Resource> {
		return (await axios.post(`${this.getUrl(req.orgId)}/${req.resourceId}/restart`, {})).data;
	}
	static async enableTcpProxy(req: RestartManagedResourceRequest): Promise<Resource> {
		return (await axios.post(`${this.getUrl(req.orgId)}/${req.resourceId}/enable-tcp-proxy`, {}))
			.data;
	}

	static async disableTcpProxy(req: RestartManagedResourceRequest): Promise<Resource> {
		return (await axios.post(`${this.getUrl(req.orgId)}/${req.resourceId}/disable-tcp-proxy`, {}))
			.data;
	}
}
