import { translate } from '@/utils';
import parser from 'cron-parser';
import * as z from 'zod';
import { NameSchema } from './schema';
import { BaseGetRequest, BaseParams, BaseRequest, Log } from './type';
export interface Task {
	orgId: string;
	appId: string;
	versionId: string;
	iid: string;
	name: string;
	logExecution: boolean;
	enabled: boolean;
	resourceId: string;
	type: 'code' | 'flow';
	logic: string;
	cronExpression: string;
	createdBy: string;
	updatedBy: string;
	__v: string;
	_id: string;
	createdAt: string;
	updatedAt: string;
}

export const TaskScheme = z.object({});

export const CreateTaskSchema = z.object({
	name: NameSchema,
	logExecution: z.boolean().default(true),
	enabled: z.boolean().default(true),
	type: z.enum(['code', 'flow']).default('code'),

	cronExpression: z
		.string({
			required_error: translate('forms.required', {
				label: translate('task.syntax'),
			}),
		})
		.superRefine((value, ctx) => {
			try {
				parser.parseExpression(value);
				return true;
			} catch (e) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: translate('forms.invalid', {
						label: translate('task.syntax'),
					}),
				});
				return false;
			}
		}),
});

export interface CreateTaskParams extends BaseParams, BaseRequest {
	name: string;
	logExecution: boolean;
	type: 'code' | 'flow';
	cronExpression: string;
	resourceId: string;
}
export interface UpdateTaskParams extends CreateTaskParams {
	taskId: string;
}
export interface DeleteTaskParams extends BaseRequest, BaseParams {
	taskId: string;
}
export interface DeleteMultipleTasksParams extends BaseRequest, BaseParams {
	taskIds: string[];
}
export interface GetTaskParams extends BaseParams {
	taskId: string;
}
export type GetTasksParams = BaseGetRequest &
	BaseParams & {
		workspace?: boolean;
	};

export interface SaveTaskLogicParams extends BaseParams, BaseRequest {
	taskId: string;
	logic: string;
}

export interface TestTaskParams extends BaseParams, BaseRequest {
	taskId: string;
	debugChannel: string;
}
export interface TestTaskLogs {
	[key: string]: Log[];
}
