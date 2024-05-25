import { z } from 'zod';
import { NameSchema } from '.';
import { BaseRequest } from './type';

export type OrgRoles = 'Admin' | 'Member' | 'Resource Manager' | 'Viewer';
export interface Organization {
	_id: string;
	ownerUserId: string;
	iid: string;
	name: string;
	color: string;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
	pictureUrl: string;
	updatedBy: string;
	__v: number;
	role: OrgRoles;
}
export interface CreateOrganizationRequest extends BaseRequest {
	name: string;
}
export interface LeaveOrganizationRequest extends BaseRequest {
	organizationId: string;
}

export const CreateOrganizationSchema = z.object({
	name: NameSchema,
});
export interface ChangeOrganizationNameRequest extends BaseRequest {
	name: string;
	organizationId: string;
}

export interface ChangeOrganizationAvatarRequest extends BaseRequest {
	organizationId: string;
	picture: File;
}

export interface GetOrganizationMembersRequest {
	roles?: string[];
	sortBy?: string;
	sortDir?: string;
	start?: string;
	end?: string;
	search?: string;
	organizationId: string;
	excludeSelf?: boolean;
}

export interface OrganizationMember {
	_id: string;
	orgId: string;
	role: string;
	joinDate: string;
	member: {
		_id: string;
		iid: string;
		color: string;
		
		name: string;
		pictureUrl: string;
		email: string;
		isOrgOwner: boolean;
	};
}
export interface OrgMemberRequest {
	email: string;
	role: OrgRoles | '';
}
export interface InviteOrgRequest extends BaseRequest {
	members: OrgMemberRequest[];
	organizationId: string;
	uiBaseURL: string;
}

export interface RemoveMemberFromOrganizationRequest extends BaseRequest {
	userId?: string;
	userIds?: string[];
}
export interface OrgRoleDefinition {
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
	member: {
		view: boolean;
		update: boolean;
		delete: boolean;
	};
	app: {
		view: boolean;
		viewAll: boolean;
		create: boolean;
		update: boolean;
	};
	resource: {
		view: boolean;
		add: boolean;
		create: boolean;
		update: boolean;
		delete: boolean;
	};
}
export interface OrgRolePermissions {
	org: OrgRoleDefinition;
}
export interface OrgPermissions {
	Admin: OrgRolePermissions;
	Member: OrgRolePermissions;
	Viewer: OrgRolePermissions;
	'Resource Manager': OrgRolePermissions;
}
