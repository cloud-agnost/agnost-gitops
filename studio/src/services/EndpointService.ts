import { axios, test } from '@/helpers';
import useEnvironmentStore from '@/store/environment/environmentStore';
import {
	CreateEndpointParams,
	DeleteEndpointParams,
	DeleteMultipleEndpointsParams,
	Endpoint,
	GetEndpointByIdParams,
	GetEndpointsByIidParams,
	GetEndpointsParams,
	SaveEndpointLogicParams,
	TestEndpointParams,
	UpdateEndpointParams,
} from '@/types';
import { arrayToObj, isEmpty } from '@/utils';

export default class EndpointService {
	static url = '/v1/org';

	static async createEndpoint({
		orgId,
		appId,
		versionId,
		...data
	}: CreateEndpointParams): Promise<Endpoint> {
		return (await axios.post(`${this.url}/${orgId}/app/${appId}/version/${versionId}/ep`, data))
			.data;
	}

	static async getEndpointById({
		orgId,
		appId,
		versionId,
		epId,
	}: GetEndpointByIdParams): Promise<Endpoint> {
		return (await axios.get(`${this.url}/${orgId}/app/${appId}/version/${versionId}/ep/${epId}`))
			.data;
	}

	static async getEndpoints(params: GetEndpointsParams): Promise<Endpoint[]> {
		const { orgId, appId, versionId, search, size, page, sortBy, sortDir } = params;
		return (
			await axios.get(`${this.url}/${orgId}/app/${appId}/version/${versionId}/ep`, {
				params: {
					search,
					size,
					page,
					sortBy,
					sortDir,
				},
			})
		).data;
	}
	static async getEndpointsByIid({
		orgId,
		appId,
		versionId,
		...data
	}: GetEndpointsByIidParams): Promise<Endpoint[]> {
		return (await axios.post(`${this.url}/${orgId}/app/${appId}/version/${versionId}/ep/iid`, data))
			.data;
	}

	static async deleteEndpoint({
		orgId,
		appId,
		versionId,
		endpointId,
	}: DeleteEndpointParams): Promise<void> {
		return (
			await axios.delete(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/ep/${endpointId}`,
				{
					data: {},
				},
			)
		).data;
	}

	static async deleteMultipleEndpoints({
		orgId,
		appId,
		versionId,
		...data
	}: DeleteMultipleEndpointsParams): Promise<void> {
		return (
			await axios.delete(`${this.url}/${orgId}/app/${appId}/version/${versionId}/ep/delete-multi`, {
				data,
			})
		).data;
	}

	static async updateEndpoint({
		orgId,
		appId,
		versionId,
		epId,
		...data
	}: UpdateEndpointParams): Promise<Endpoint> {
		return (
			await axios.put(`${this.url}/${orgId}/app/${appId}/version/${versionId}/ep/${epId}`, data)
		).data;
	}

	static async saveEndpointLogic({
		orgId,
		appId,
		versionId,
		endpointId,
		...data
	}: SaveEndpointLogicParams): Promise<Endpoint> {
		return (
			await axios.put(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/ep/${endpointId}/logic`,
				data,
			)
		).data;
	}

	static async testEndpoint({
		method,
		path,
		params,
		headers,
		body,
		formData,
		consoleLogId,
		signal,
	}: TestEndpointParams): Promise<any> {
		const formDataObj = new FormData();
		if (formData) {
			formData.forEach((data) => {
				if (data.file) {
					formDataObj.append(data.key, data.file, data.file.name);
				} else {
					formDataObj.append(data.key, data.value as string);
				}
			});
		}
		const options = {
			headers: {
				...arrayToObj(headers ?? []),
				'Content-Type': !isEmpty(formData) ? 'multipart/form-data' : 'application/json',
				'Agnost-Session': consoleLogId,
			},
			params: {
				...arrayToObj(params.queryParams ?? []),
			},
			data: body,
		};
		let opt: any;
		if (method === 'get' || method === 'delete') {
			opt = options;
		} else {
			opt = !isEmpty(formData) ? formDataObj : body;
		}
		const response = await test[method](
			`${useEnvironmentStore.getState().environment?.iid}${path}`,
			opt,
			{
				...options,
				signal,
			},
		);
		return response;
	}
}
