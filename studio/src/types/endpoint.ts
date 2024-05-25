import { FORBIDDEN_EP_PREFIXES } from '@/constants';
import { PARAM_NAME_REGEX, ROUTE_NAME_REGEX } from '@/constants/regex';
import { BaseGetRequest, BaseParams, BaseRequest, Log } from '@/types';
import { NameSchema } from '@/types/schema';
import { getPathParams, translate as t } from '@/utils';
import { AxiosError, AxiosResponse } from 'axios';
import * as z from 'zod';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE'] as const;

export type HttpMethod = 'POST' | 'GET' | 'PUT' | 'DELETE';

export const CreateEndpointSchema = z.object({
	name: NameSchema,
	method: z
		.enum(HTTP_METHODS, {
			required_error: t('forms.required', {
				label: t('endpoint.errors.invalidMethod'),
			}),
		})
		.default('GET'),
	path: z
		.string({
			required_error: t('forms.required', {
				label: t('endpoint.create.path'),
			}),
		})
		.superRefine((value, ctx) => {
			if (value !== '/') {
				if (!ROUTE_NAME_REGEX.test(value)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: t('endpoint.errors.notValidRoute'),
					});
				}

				const parameterNames = getPathParams(value);

				// Validate parameter names
				for (const paramName of parameterNames) {
					if (!PARAM_NAME_REGEX.test(paramName)) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: t('endpoint.errors.invalidParams', {
								param: paramName,
							}),
						});
					}
				}
				const uniqueParameterNames = new Set(parameterNames);
				if (uniqueParameterNames.size !== parameterNames.length) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: t('endpoint.errors.duplicateParam'),
					});
				}
				if (FORBIDDEN_EP_PREFIXES.find((prefix) => value.startsWith(prefix))) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: t('endpoint.errors.reservedKeyword', {
							keyword: value.split('/')[1],
						}),
					});
				}
			}
		}),
	timeout: z
		.number({
			required_error: t('forms.required', {
				label: t('endpoint.create.timeout'),
			}),
		})
		.int()
		.positive()
		.optional()
		.nullish(),
	apiKeyRequired: z.boolean().default(false),
	sessionRequired: z.boolean().default(false),
	logExecution: z.boolean().default(true),
	rateLimits: z.array(z.string()).optional(),
	middlewares: z.array(z.string()).optional(),
});

export interface Endpoint {
	orgId: string;
	appId: string;
	versionId: string;
	iid: string;
	name: string;
	method: HttpMethod;
	path: string;
	fingerprint: string;
	timeout: number;
	apiKeyRequired: boolean;
	sessionRequired: boolean;
	logExecution: boolean;
	type: string;
	logic: string;
	rateLimits: string[];
	middlewares: string[];
	createdBy: string;
	updatedBy: string;
	_id: string;
	createdAt: string;
	updatedAt: string;
	__v: number;
}

export interface CreateEndpointParams extends BaseParams, BaseRequest {
	name: string;
	method: HttpMethod;
	path: string;
	apiKeyRequired: boolean;
	sessionRequired: boolean;
	logExecution: boolean;
	timeout?: number | null;
	rateLimits?: string[];
	middlewares?: string[];
}

export type UpdateEndpointParams = CreateEndpointParams & {
	epId: string;
};

export interface GetEndpointByIdParams extends BaseParams {
	epId: string;
}
export interface SaveEndpointLogicParams extends BaseParams, BaseRequest {
	endpointId: string;
	logic: string;
}

export interface DeleteEndpointParams extends BaseParams, BaseRequest {
	endpointId: string;
}

export interface DeleteMultipleEndpointsParams extends BaseParams, BaseRequest {
	endpointIds: string[];
}

export interface GetEndpointsByIidParams extends BaseParams {
	iids: string[];
}
export interface GetEndpointsParams extends BaseParams, BaseGetRequest {
	workspace?: boolean;
}

export type TestMethods = 'get' | 'post' | 'put' | 'delete';
export interface TestEndpointParams extends BaseRequest {
	epId: string;
	path: string;
	envId: string;
	consoleLogId: string;
	signal: AbortSignal;
	params: {
		queryParams?: Record<string, string>[];
		pathVariables?: { value: string; key: string }[];
	};
	body?: string;
	bodyType?: 'json' | 'form-data';
	headers?: { value: string; key: string }[];
	method: 'get' | 'post' | 'put' | 'delete';
	formData?: {
		key: string;
		value?: string;
		file?: File;
		type: 'text' | 'file';
	}[];
}

export interface TestResponse extends AxiosResponse {
	cookies: any;
	epId: string;
	duration?: string;
	response?: AxiosError['response'];
}

export interface EndpointResponse {
	[key: string]: TestResponse;
}
export interface EndpointLogs {
	[key: string]: Log[];
}
export interface EndpointRequest {
	[key: string]: TestEndpointParams;
}
