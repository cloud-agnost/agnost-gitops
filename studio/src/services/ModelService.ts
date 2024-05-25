import { axios } from '@/helpers';
import {
	AddNewFieldParams,
	CreateModelParams,
	DeleteFieldParams,
	DeleteModelParams,
	DeleteMultipleFieldParams,
	DeleteMultipleModelParams,
	DisableTimestampsParams,
	EnableTimestampsParams,
	GetModelsOfDatabaseParams,
	GetSpecificModelByIidOfDatabase,
	GetSpecificModelOfDatabase,
	Model,
	UpdateFieldParams,
	UpdateNameAndDescriptionParams,
} from '@/types';

export default class ModelService {
	static url = '/v1/org';

	static async getModelsOfDatabase({
		orgId,
		appId,
		versionId,
		dbId,
	}: GetModelsOfDatabaseParams): Promise<Model[]> {
		return (
			await axios.get(`${this.url}/${orgId}/app/${appId}/version/${versionId}/db/${dbId}/model`)
		).data;
	}

	static async getSpecificModelByIidOfDatabase({
		orgId,
		appId,
		versionId,
		dbId,
		modelIid,
	}: GetSpecificModelByIidOfDatabase): Promise<Model> {
		return (
			await axios.get(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/db/${dbId}/model/iid/${modelIid}`,
			)
		).data;
	}
	static async getSpecificModelOfDatabase({
		orgId,
		appId,
		versionId,
		dbId,
		modelId,
	}: GetSpecificModelOfDatabase): Promise<Model> {
		return (
			await axios.get(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/db/${dbId}/model/${modelId}`,
			)
		).data;
	}

	static async createModel({ orgId, appId, versionId, dbId, ...data }: CreateModelParams) {
		return (
			await axios.post(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/db/${dbId}/model`,
				data,
			)
		).data;
	}

	static async updateNameAndDescription({
		orgId,
		appId,
		versionId,
		dbId,
		modelId,
		...data
	}: UpdateNameAndDescriptionParams): Promise<Model> {
		return (
			await axios.put(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/db/${dbId}/model/${modelId}`,
				data,
			)
		).data;
	}

	static async deleteModel({ orgId, appId, versionId, dbId, modelId }: DeleteModelParams) {
		return (
			await axios.delete(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/db/${dbId}/model/${modelId}`,
				{
					data: {},
				},
			)
		).data;
	}

	static async deleteMultipleModel({
		orgId,
		appId,
		versionId,
		dbId,
		...data
	}: DeleteMultipleModelParams) {
		return (
			await axios.delete(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/db/${dbId}/model/delete-multi`,
				{
					data,
				},
			)
		).data;
	}

	static async addNewField({
		orgId,
		appId,
		versionId,
		dbId,
		modelId,
		...data
	}: AddNewFieldParams): Promise<Model> {
		return (
			await axios.post(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/db/${dbId}/model/${modelId}/fields`,
				data,
			)
		).data;
	}

	static async deleteField({
		orgId,
		appId,
		versionId,
		dbId,
		modelId,
		fieldId,
	}: DeleteFieldParams): Promise<Model> {
		return (
			await axios.delete(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/db/${dbId}/model/${modelId}/fields/${fieldId}`,
				{
					data: {},
				},
			)
		).data;
	}

	static async deleteMultipleField({
		orgId,
		appId,
		versionId,
		dbId,
		modelId,
		...data
	}: DeleteMultipleFieldParams): Promise<Model> {
		return (
			await axios.delete(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/db/${dbId}/model/${modelId}/fields/delete-multi`,
				{ data },
			)
		).data;
	}

	static async updateField({
		orgId,
		appId,
		versionId,
		dbId,
		modelId,
		fieldId,
		...data
	}: UpdateFieldParams): Promise<Model> {
		return (
			await axios.put(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/db/${dbId}/model/${modelId}/fields/${fieldId}`,
				data,
			)
		).data;
	}

	static async getReferenceModels({
		orgId,
		appId,
		versionId,
		dbId,
	}: GetModelsOfDatabaseParams): Promise<Model[]> {
		return (
			await axios.get(`${this.url}/${orgId}/app/${appId}/version/${versionId}/db/${dbId}/model/ref`)
		).data;
	}

	static async enableTimestamps({
		orgId,
		appId,
		versionId,
		dbId,
		modelId,
		...data
	}: EnableTimestampsParams): Promise<Model> {
		return (
			await axios.put(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/db/${dbId}/model/${modelId}/enable-timestamps`,
				data,
			)
		).data;
	}
	static async disableTimestamps({
		orgId,
		appId,
		versionId,
		dbId,
		modelId,
	}: DisableTimestampsParams): Promise<Model> {
		return (
			await axios.put(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/db/${dbId}/model/${modelId}/disable-timestamps`,
				{},
			)
		).data;
	}
}
