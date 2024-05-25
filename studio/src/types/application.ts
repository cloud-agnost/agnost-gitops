import { z } from 'zod';
import { EnvLog, Environment } from './environment';
import { ResLog, Resource } from './resource';
import { NameSchema } from './schema';
import { BaseRequest, UpdateRoleRequest } from './type';
import { Version } from './version';

export enum AppRoles {
	Admin = 'Admin',
	Developer = 'Developer',
	Viewer = 'Viewer',
}
export interface Application {
	_id: string;
	orgId: string;
	iid: string;
	ownerUserId: string;
	name: string;
	color: string;
	team: AppTeam[];
	createdBy: string;
	createdAt: string;
	updatedAt: string;
	pictureUrl: string;
	role: AppRoles;
}

export interface AppTeam {
	userId: TeamMember;
	role: string;
	_id: string;
	joinDate: string;
}

type TeamMember = {
	_id: string;
	name: string;
	color: string;
	pictureUrl: string;
	iid: string;
	isAppOwner: boolean;
	email: string;
};

export interface CreateApplicationRequest extends BaseRequest {
	name: string;
	orgId: string;
}
export const CreateApplicationSchema = z.object({
	name: NameSchema,
});

export interface CreateApplicationResponse {
	app: Application;
	env: Environment;
	envLog: EnvLog;
	resLog: ResLog;
	version: Version;
	resource: Resource;
}
export interface DeleteApplicationRequest extends BaseRequest {
	appId: string;
	orgId: string;
}
export interface ChangeAppNameRequest extends BaseRequest, UpdateAppParams {
	name: string;
}
export interface SetAppAvatarRequest extends BaseRequest, UpdateAppParams {
	picture: File;
	appId: string;
}

export interface ApplicationMember {
	_id: string;
	appId: string;
	role: string;
	joinDate: string;
	member: TeamMember;
}
export interface TeamOption {
	readonly value: ApplicationMember;
	readonly label: string;
}
export interface AppMemberRequest {
	email: string;
	role: AppRoles | '';
	uiBaseURL: string;
}
export interface AppInviteRequest extends BaseRequest, UpdateAppParams {
	members: AppMemberRequest[];
	uiBaseURL: string;
}

interface AuthPermissions {
	update: boolean;
}

interface PackagePermissions extends AuthPermissions {
	create: boolean;
	update: boolean;
	delete: boolean;
}

interface KeyPermissions extends AuthPermissions {
	create: boolean;
	update: boolean;
	delete: boolean;
}

interface LimitPermissions extends AuthPermissions {
	create: boolean;
	update: boolean;
	delete: boolean;
}

interface ParamPermissions extends AuthPermissions {
	create: boolean;
	update: boolean;
	delete: boolean;
}

export interface AppRoleDefinition {
	view: boolean;
	update: boolean;
	delete: boolean;
	transfer: boolean;
	viewLogs: boolean;
	invite: {
		view: boolean;
		create: boolean;
		update: boolean;
		resend: boolean;
		delete: boolean;
	};
	team: {
		view: boolean;
		update: boolean;
		delete: boolean;
	};
	version: {
		view: boolean;
		create: boolean;
		update: boolean;
		delete: boolean;
		param: ParamPermissions;
		limit: LimitPermissions;
		key: KeyPermissions;
		package: PackagePermissions;
		auth: AuthPermissions;
	};
	db: {
		view: boolean;
		create: boolean;
		update: boolean;
		delete: boolean;
	};
	model: {
		view: boolean;
		create: boolean;
		update: boolean;
		delete: boolean;
	};
	resource: {
		view: boolean;
		create: boolean;
		update: boolean;
		delete: boolean;
	};
	env: {
		view: boolean;
		update: boolean;
		deploy: boolean;
	};
	endpoint: {
		view: boolean;
		create: boolean;
		update: boolean;
		delete: boolean;
	};
	middleware: {
		view: boolean;
		create: boolean;
		update: boolean;
		delete: boolean;
	};
	queue: {
		view: boolean;
		create: boolean;
		update: boolean;
		delete: boolean;
	};
	task: {
		view: boolean;
		create: boolean;
		update: boolean;
		delete: boolean;
	};
	storage: {
		view: boolean;
		create: boolean;
		update: boolean;
		delete: boolean;
	};
}

export interface AppRolePermissions {
	app: AppRoleDefinition;
}

export interface AppPermissions {
	Admin: AppRolePermissions;
	Developer: AppRolePermissions;
	Viewer: AppRolePermissions;
}

export interface UpdateAppParams {
	appId: string;
	orgId: string;
}

export type UpdateAppMemberRoleRequest = UpdateAppParams & UpdateRoleRequest;
export type RemoveAppAvatarRequest = UpdateAppParams & BaseRequest;
export type removeMultipleAppMembers = UpdateAppParams & {
	userIds: string[];
};

export type UpdateInvitationRoleRequest = UpdateAppParams & {
	token: string;
	role: string;
};

export type DeleteInvitationRequest = UpdateAppParams & {
	token: string;
};
export type DeleteMultipleInvitationRequest = UpdateAppParams & {
	tokens: string[];
};
