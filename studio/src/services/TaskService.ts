import { axios } from '@/helpers';
import {
	CreateTaskParams,
	DeleteMultipleTasksParams,
	DeleteTaskParams,
	GetTaskParams,
	GetTasksParams,
	SaveTaskLogicParams,
	Task,
	TestTaskParams,
	UpdateTaskParams,
} from '@/types';

export default class TaskService {
	static url = '/v1/org';

	static async getTasks({ orgId, appId, versionId, ...params }: GetTasksParams): Promise<Task[]> {
		const { data } = await axios.get(
			`${this.url}/${orgId}/app/${appId}/version/${versionId}/task`,
			{ params },
		);
		return data;
	}
	static async getTask({ orgId, appId, versionId, taskId }: GetTaskParams): Promise<Task> {
		const { data } = await axios.get(
			`${this.url}/${orgId}/app/${appId}/version/${versionId}/task/${taskId}`,
		);
		return data;
	}
	static async createTask({ orgId, appId, versionId, ...body }: CreateTaskParams): Promise<Task> {
		const { data } = await axios.post(
			`${this.url}/${orgId}/app/${appId}/version/${versionId}/task`,
			body,
		);
		return data;
	}
	static async updateTaskProperties({
		orgId,
		appId,
		versionId,
		taskId,
		...body
	}: UpdateTaskParams): Promise<Task> {
		const { data } = await axios.put(
			`${this.url}/${orgId}/app/${appId}/version/${versionId}/task/${taskId}`,
			body,
		);
		return data;
	}
	static async saveTaskLogic({
		orgId,
		appId,
		versionId,
		taskId,
		...body
	}: SaveTaskLogicParams): Promise<Task> {
		const { data } = await axios.put(
			`${this.url}/${orgId}/app/${appId}/version/${versionId}/task/${taskId}/logic`,
			body,
		);
		return data;
	}
	static async testTask({
		orgId,
		appId,
		versionId,
		taskId,
		...body
	}: TestTaskParams): Promise<Task> {
		const { data } = await axios.post(
			`${this.url}/${orgId}/app/${appId}/version/${versionId}/task/${taskId}/test`,
			body,
		);
		return data;
	}

	static async deleteTask({ orgId, appId, versionId, taskId }: DeleteTaskParams): Promise<Task> {
		const { data } = await axios.delete(
			`${this.url}/${orgId}/app/${appId}/version/${versionId}/task/${taskId}`,
		);
		return data;
	}

	static async deleteMultipleTasks({
		orgId,
		appId,
		versionId,
		taskIds,
	}: DeleteMultipleTasksParams): Promise<Task[]> {
		const { data } = await axios.delete(
			`${this.url}/${orgId}/app/${appId}/version/${versionId}/task/delete-multi`,
			{
				data: { taskIds },
			},
		);
		return data;
	}
}
