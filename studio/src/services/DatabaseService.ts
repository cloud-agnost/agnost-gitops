import { axios } from '@/helpers';
import {
	CreateDatabaseParams,
	Database,
	DeleteDatabaseParams,
	GetDatabaseOfAppByIdParams,
	GetDatabasesOfAppParams,
	UpdateDatabaseParams,
} from '@/types';

export default class DatabaseService {
	static url = '/v1/org';

	static async getDatabases({
		orgId,
		appId,
		versionId,
	}: GetDatabasesOfAppParams): Promise<Database[]> {
		return (await axios.get(`${this.url}/${orgId}/app/${appId}/version/${versionId}/db`)).data;
	}

	static async getDatabaseOfAppById({
		orgId,
		appId,
		versionId,
		dbId,
	}: GetDatabaseOfAppByIdParams): Promise<Database> {
		return (await axios.get(`${this.url}/${orgId}/app/${appId}/version/${versionId}/db/${dbId}`))
			.data;
	}

	static async createDatabase({
		orgId,
		appId,
		versionId,
		...data
	}: CreateDatabaseParams): Promise<Database> {
		return (await axios.post(`${this.url}/${orgId}/app/${appId}/version/${versionId}/db`, data))
			.data;
	}

	static async updateDatabaseName({
		orgId,
		appId,
		versionId,
		dbId,
		...data
	}: UpdateDatabaseParams): Promise<Database> {
		return (
			await axios.put(`${this.url}/${orgId}/app/${appId}/version/${versionId}/db/${dbId}`, data)
		).data;
	}

	static async deleteDatabase({
		orgId,
		appId,
		versionId,
		dbId,
	}: DeleteDatabaseParams): Promise<void> {
		return (
			await axios.delete(`${this.url}/${orgId}/app/${appId}/version/${versionId}/db/${dbId}`, {
				data: {},
			})
		).data;
	}
}
