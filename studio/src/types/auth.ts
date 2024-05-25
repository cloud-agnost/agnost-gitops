import { BaseRequest } from './type';

export type LoginParams = BaseRequest & {
	email: string;
	password: string;
};

export type LogoutParams = BaseRequest;
