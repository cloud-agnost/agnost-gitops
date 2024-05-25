import { axios } from '@/helpers';
import * as funcTypes from '@/types';
export default class FunctionService {
	static url = '/v1/org';

	static async getFunctions({
		orgId,
		appId,
		versionId,
		...params
	}: funcTypes.getFunctions): Promise<funcTypes.HelperFunction[]> {
		return (
			await axios.get(`${this.url}/${orgId}/app/${appId}/version/${versionId}/func`, {
				params,
			})
		).data;
	}

	static async getFunctionById({
		orgId,
		appId,
		versionId,
		funcId,
	}: funcTypes.GetFunctionByIdParams): Promise<funcTypes.HelperFunction> {
		return (
			await axios.get(`${this.url}/${orgId}/app/${appId}/version/${versionId}/func/${funcId}`)
		).data;
	}

	static async deleteFunction({
		orgId,
		appId,
		versionId,
		functionId,
	}: funcTypes.DeleteFunctionParams) {
		return (
			await axios.delete(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/func/${functionId}`,
			)
		).data;
	}

	static async deleteMultipleFunctions({
		orgId,
		appId,
		versionId,
		...data
	}: funcTypes.DeleteMultipleFunctions) {
		return (
			await axios.delete(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/func/delete-multi`,
				{
					data,
				},
			)
		).data;
	}

	static async createFunction({
		orgId,
		appId,
		versionId,
		...data
	}: funcTypes.CreateFunctionParams): Promise<funcTypes.HelperFunction> {
		return (await axios.post(`${this.url}/${orgId}/app/${appId}/version/${versionId}/func`, data))
			.data;
	}

	static async updateFunction({
		orgId,
		appId,
		versionId,
		funcId,
		...data
	}: funcTypes.UpdateFunctionParams): Promise<funcTypes.HelperFunction> {
		return (
			await axios.put(`${this.url}/${orgId}/app/${appId}/version/${versionId}/func/${funcId}`, data)
		).data;
	}

	static async saveFunctionCode({
		orgId,
		appId,
		versionId,
		functionId,
		...data
	}: funcTypes.SaveFunctionCodeParams) {
		return (
			await axios.put(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/func/${functionId}/logic`,
				data,
			)
		).data;
	}
}
