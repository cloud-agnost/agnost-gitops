import { translate } from '@/utils';
import * as z from 'zod';
import { NameSchema } from './schema';
import { BaseGetRequest, BaseParams, BaseRequest, Log } from './type';

export interface MessageQueue {
	orgId: string;
	appId: string;
	versionId: string;
	iid: string;
	name: string;
	logExecution: boolean;
	delay: number;
	type: 'code' | 'flow';
	logic: string;
	createdBy: string;
	updatedBy: string;
	_id: string;
	createdAt: string;
	updatedAt: string;
	delayedMessages: boolean;
}

export type GetMessageQueuesParams = BaseParams &
	BaseGetRequest & {
		workspace?: boolean;
	};

export interface GetMessageQueueByIdParams extends BaseParams {
	queueId: string;
}
export type DeleteMessageQueueParams = GetMessageQueueByIdParams & BaseRequest;
export interface DeleteMultipleQueuesParams extends BaseParams, BaseRequest {
	queueIds: string[];
}
export const MessageQueueSchema = z.object({
	name: NameSchema,
	delay: z.coerce.number().int().positive().optional().nullish(),
	logExecution: z.boolean().default(true),
});
export const CreateMessageQueueSchema = MessageQueueSchema.extend({
	resourceId: z.string({
		required_error: translate('forms.required', {
			label: translate('queue.create.resource.title'),
		}),
	}),
});

export interface CreateMessageQueueParams extends BaseRequest, BaseParams {
	name: string;
	logExecution: boolean;
	delay?: number | null;
	resourceId: string;
}
export interface UpdateQueueParams extends Omit<CreateMessageQueueParams, 'resourceId'> {
	queueId: string;
}
export interface UpdateQueueLogicParams extends BaseRequest, BaseParams {
	logic: string;
	queueId: string;
}
export interface TestQueueParams extends BaseRequest, BaseParams {
	queueId: string;
	debugChannel: string;
	payload: string;
}

export interface TestQueueLogs {
	[key: string]: {
		payload: string;
		logs?: Log[];
	};
}
