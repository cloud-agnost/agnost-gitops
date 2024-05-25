import { UI_BASE_URL } from '@/constants';
import { axios } from '@/helpers';
import {
	AppInviteRequest,
	AppPermissions,
	Application,
	ApplicationMember,
	ChangeAppNameRequest,
	GetInvitationRequest,
	Invitation,
	InvitationRequest,
	RemoveMemberRequest,
	SetAppAvatarRequest,
	TransferRequest,
	UpdateAppMemberRoleRequest,
	UpdateAppParams,
	UpdateRoleRequest,
} from '@/types';

import { arrayToQueryString } from '@/utils';
export default class ApplicationService {
	static url = '/v1/org/:orgId/app/:appId';

	static getUrl(orgId: string, appId: string) {
		return this.url.replace(':orgId', orgId as string).replace(':appId', appId as string);
	}

	static async getAppById(orgId: string, appId: string): Promise<Application> {
		return (await axios.get(`v1/org/${orgId}/app/${appId}`)).data;
	}
	static async changeAppName(req: ChangeAppNameRequest): Promise<Application> {
		return (await axios.put(`${this.getUrl(req.orgId, req.appId)}`, { name: req.name })).data;
	}
	static async setAppAvatar(req: SetAppAvatarRequest): Promise<Application> {
		const formData = new FormData();
		formData.append('picture', req.picture, req.picture.name);
		return (
			await axios.put(`${this.getUrl(req.orgId, req.appId)}/picture`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			})
		).data;
	}
	static async removeAppAvatar(req: UpdateAppParams): Promise<Application> {
		return (await axios.delete(`${this.getUrl(req.orgId, req.appId)}/picture`)).data;
	}
	static async transferAppOwnership(req: TransferRequest): Promise<Application> {
		return (
			await axios.post(
				`${this.getUrl(req?.orgId as string, req.appId as string)}/transfer/${req.userId}`,
				{
					userId: req.userId,
				},
			)
		).data;
	}

	static async getAppMembers(req: UpdateAppParams): Promise<ApplicationMember[]> {
		return (await axios.get(`${this.getUrl(req.orgId, req.appId)}/team`)).data;
	}

	static async changeMemberRole(req: UpdateAppMemberRoleRequest): Promise<ApplicationMember> {
		return (
			await axios.put(`${this.getUrl(req.orgId, req.appId)}/team/${req.userId}`, {
				role: req.role,
			})
		).data;
	}

	static async removeAppMember(req: RemoveMemberRequest) {
		return (
			await axios.delete(
				`${this.getUrl(req.orgId as string, req.appId as string)}/team/${req.userId}`,
				{
					data: {},
				},
			)
		).data;
	}
	static async removeMultipleAppMembers(req: RemoveMemberRequest): Promise<void> {
		return (
			await axios.post(
				`${this.getUrl(req.orgId as string, req.appId as string)}/team/delete-multi`,
				{
					userIds: req.userIds,
				},
			)
		).data;
	}
	static async inviteUsersToApp(req: AppInviteRequest): Promise<Invitation[]> {
		return (
			await axios.post(
				`${this.getUrl(req.orgId, req.appId)}/invite?uiBaseURL=${req.uiBaseURL}`,
				req.members,
			)
		).data;
	}
	static async getAppInvitations(req: GetInvitationRequest): Promise<Invitation[]> {
		const { roles, ...params } = req;
		const role = arrayToQueryString(roles as string[], 'role');
		return (
			await axios.get(`${this.getUrl(req.orgId as string, req.appId as string)}/invite?${role}`, {
				params,
			})
		).data;
	}

	static async resendInvitation(req: InvitationRequest): Promise<Invitation> {
		return (
			await axios.post(
				`${this.getUrl(req.orgId as string, req.appId as string)}/invite/resend?token=${
					req.token
				}&uiBaseURL=${UI_BASE_URL}`,
				{
					token: req.token,
				},
			)
		).data;
	}

	static async updateInvitationUserRole(req: UpdateRoleRequest): Promise<Invitation> {
		return (
			await axios.put(
				`${this.getUrl(req.orgId as string, req.appId as string)}/invite?token=${req.token}`,
				{
					role: req.role,
				},
			)
		).data;
	}
	static async deleteInvitation(req: InvitationRequest): Promise<Invitation> {
		return (
			await axios.delete(
				`${this.getUrl(req.orgId as string, req.appId as string)}/invite?token=${req.token}`,
				{
					data: {},
				},
			)
		).data;
	}

	static async deleteMultipleInvitations(req: InvitationRequest): Promise<Invitation[]> {
		return (
			await axios.delete(`${this.getUrl(req.orgId as string, req.appId as string)}/invite/multi`, {
				data: {
					tokens: req.tokens,
				},
			})
		).data;
	}

	static async getAllAppRoleDefinitions(orgId: string): Promise<AppPermissions> {
		return (await axios.get(`v1/org/${orgId}/app/roles`)).data;
	}
}
