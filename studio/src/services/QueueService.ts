import { axios } from '@/helpers';
import {
	CreateMessageQueueParams,
	DeleteMessageQueueParams,
	DeleteMultipleQueuesParams,
	GetMessageQueueByIdParams,
	GetMessageQueuesParams,
	MessageQueue,
	TestQueueParams,
	UpdateQueueLogicParams,
	UpdateQueueParams,
} from '@/types';

export default class QueueService {
	static url = '/v1/org';

	static async getQueues({
		orgId,
		appId,
		versionId,
		...params
	}: GetMessageQueuesParams): Promise<MessageQueue[]> {
		return (
			await axios.get(`${this.url}/${orgId}/app/${appId}/version/${versionId}/queue`, {
				params,
			})
		).data;
	}

	static async getQueueById({ orgId, appId, versionId, queueId }: GetMessageQueueByIdParams) {
		return (
			await axios.get(`${this.url}/${orgId}/app/${appId}/version/${versionId}/queue/${queueId}`)
		).data;
	}

	static async deleteQueue({ orgId, appId, versionId, queueId }: DeleteMessageQueueParams) {
		return axios.delete(`${this.url}/${orgId}/app/${appId}/version/${versionId}/queue/${queueId}`);
	}

	static async deleteMultipleQueues({
		orgId,
		appId,
		versionId,
		queueIds,
	}: DeleteMultipleQueuesParams) {
		return axios.delete(
			`${this.url}/${orgId}/app/${appId}/version/${versionId}/queue/delete-multi`,
			{
				data: {
					queueIds,
				},
			},
		);
	}

	static async createQueue({
		orgId,
		appId,
		versionId,
		...data
	}: CreateMessageQueueParams): Promise<MessageQueue> {
		return (await axios.post(`${this.url}/${orgId}/app/${appId}/version/${versionId}/queue`, data))
			.data;
	}

	static async updateQueue({
		orgId,
		appId,
		versionId,
		queueId,
		...data
	}: UpdateQueueParams): Promise<MessageQueue> {
		return (
			await axios.put(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/queue/${queueId}`,
				data,
			)
		).data;
	}

	static async updateQueueLogic({
		orgId,
		appId,
		versionId,
		queueId,
		...data
	}: UpdateQueueLogicParams): Promise<MessageQueue> {
		return (
			await axios.put(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/queue/${queueId}/logic`,
				data,
			)
		).data;
	}

	static async testQueue({
		orgId,
		appId,
		versionId,
		queueId,
		...data
	}: TestQueueParams): Promise<MessageQueue> {
		return (
			await axios.post(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/queue/${queueId}/test`,
				data,
			)
		).data;
	}
}
