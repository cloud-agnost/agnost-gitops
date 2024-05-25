import * as z from 'zod';
import { NameSchema } from './schema';
import { BaseGetRequest, BaseParams, BaseRequest } from './type';

export interface HelperFunction {
	orgId: string;
	appId: string;
	versionId: string;
	iid: string;
	name: string;
	type: 'code' | 'flow';
	logic: string;
	createdBy: string;
	updatedBy?: string;
	_id: string;
	createdAt: string;
	updatedAt: string;
	__v: number;
}
export type getFunctions = BaseParams &
	BaseGetRequest & {
		workspace?: boolean;
	};

export type GetFunctionByIdParams = BaseParams & {
	funcId: string;
};
export interface DeleteMultipleFunctions extends BaseParams, BaseRequest {
	functionIds: string[];
}
export type DeleteFunctionParams = BaseParams & {
	functionId: string;
} & BaseRequest;
export interface CreateFunctionParams extends BaseParams, BaseRequest {
	name: string;
}
export type UpdateFunctionParams = GetFunctionByIdParams & Partial<HelperFunction> & BaseRequest;
export interface SaveFunctionCodeParams extends BaseParams, BaseRequest {
	functionId: string;
	logic: string;
}
export const CreateFunctionSchema = z.object({
	name: NameSchema,
});
