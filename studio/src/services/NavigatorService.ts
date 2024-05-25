import { http } from '@/helpers';
import useDatabaseStore from '@/store/database/databaseStore';
import useModelStore from '@/store/database/modelStore';
import useEnvironmentStore from '@/store/environment/environmentStore';
import {
	DeleteDataFromModelParams,
	DeleteMultipleDataFromModelParams,
	GetDataFromModelParams,
	UpdateDataFromModelParams,
} from '@/types';

export default class NavigatorService {
	static getUrl() {
		const dbName = useDatabaseStore.getState().database.name;
		const modelName = useModelStore.getState().model.name;
		return `${useEnvironmentStore.getState().environment
			?.iid}/agnost/database/${dbName}/model/${modelName}`;
	}

	static async getDataFromModel({ filter, ...params }: GetDataFromModelParams) {
		return (
			await http.post(
				this.getUrl(),
				{
					filter,
				},
				{
					params,
				},
			)
		).data;
	}

	static async deleteDataFromModel({ id }: DeleteDataFromModelParams) {
		return (
			await http.delete(`${this.getUrl()}/${id}`, {
				data: {},
			})
		).data;
	}

	static async deleteMultipleDataFromModel({ ids }: DeleteMultipleDataFromModelParams) {
		return (
			await http.delete(`${this.getUrl()}/delete-multi`, {
				data: {
					ids,
				},
			})
		).data;
	}

	static async updateDataFromModel({ id, data, isSubObjectUpdate }: UpdateDataFromModelParams) {
		return (
			await http.put(`${this.getUrl()}/${id}`, {
				isSubObjectUpdate,
				data,
			})
		).data;
	}
}
