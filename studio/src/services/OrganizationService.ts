import { axios } from '@/helpers';
import useOrganizationStore from '@/store/organization/organizationStore';
import {
	Application,
	ChangeOrganizationAvatarRequest,
	CreateApplicationRequest,
	CreateApplicationResponse,
	GetInvitationRequest,
	GetOrganizationMembersRequest,
	Invitation,
	InviteOrgRequest,
	OrgPermissions,
	Organization,
	OrganizationMember,
} from '@/types';
import { arrayToQueryString } from '@/utils';
export default class OrganizationService {
	static url = '/v1/org';

	static async getAllOrganizationsByUser(): Promise<Organization[]> {
		return (await axios.get(`${this.url}`)).data;
	}

	static async getOrganizationById(organizationId: string): Promise<Organization> {
		const res = await axios.get(`${this.url}/${organizationId}`);
		return res.data;
	}

	static async createOrganization(name: string): Promise<Organization> {
		return (await axios.post(`${this.url}`, { name })).data;
	}

	static async leaveOrganization(organizationId: string): Promise<void> {
		return (
			await axios.delete(`${this.url}/${organizationId}/member`, {
				data: {
					organizationId,
				},
			})
		).data;
	}

	static async changeOrganizationName(name: string, organizationId: string): Promise<Organization> {
		return (
			await axios.put(`${this.url}/${organizationId}`, {
				name,
			})
		).data;
	}

	static async changeOrganizationAvatar(
		req: ChangeOrganizationAvatarRequest,
	): Promise<Organization> {
		const formData = new FormData();
		formData.append('picture', req.picture, req.picture.name);
		return (
			await axios.put(`${this.url}/${req.organizationId}/picture`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			})
		).data;
	}
	static async removeOrganizationAvatar(organizationId: string): Promise<Organization> {
		return (await axios.delete(`${this.url}/${organizationId}/picture`)).data;
	}

	static async getOrganizationMembers(
		req: GetOrganizationMembersRequest,
	): Promise<OrganizationMember[]> {
		const { roles, sortBy, sortDir, search, organizationId, excludeSelf } = req;
		const role = arrayToQueryString(roles ?? [], 'role');
		return (
			await axios.get(
				`${this.url}/${organizationId}/member${excludeSelf ? '/exclude-current' : ''}?${role}`,
				{
					params: {
						role,
						sortBy,
						sortDir,
						search,
					},
				},
			)
		).data;
	}

	static async transferOrganization(organizationId: string, userId: string) {
		return (await axios.post(`${this.url}/${organizationId}/transfer/${userId}`, { userId })).data;
	}
	static async deleteOrganization(organizationId: string) {
		return (await axios.delete(`${this.url}/${organizationId}`, { data: {} })).data;
	}
	static async inviteUsersToOrganization(req: InviteOrgRequest) {
		return (
			await axios.post(
				`${this.url}/${req.organizationId}/invite?uiBaseURL=${req.uiBaseURL}`,
				req.members,
			)
		).data;
	}

	static async getOrganizationInvitations(req: GetInvitationRequest): Promise<Invitation[]> {
		const { roles, ...params } = req;
		const role = arrayToQueryString(roles ?? [], 'role');
		return (
			await axios.get(
				`${this.url}/${useOrganizationStore.getState().organization?._id}/invite?${role}`,
				{
					params: params,
				},
			)
		).data;
	}

	static async deleteInvitation(token: string) {
		return (
			await axios.delete(
				`${this.url}/${useOrganizationStore.getState().organization?._id}/invite?token=${token}`,
				{
					data: {},
				},
			)
		).data;
	}

	static async deleteMultipleInvitations(tokens: string[]) {
		return (
			await axios.delete(
				`${this.url}/${useOrganizationStore.getState().organization?._id}/invite/multi`,
				{
					data: {
						tokens,
					},
				},
			)
		).data;
	}

	static async resendInvitation(token: string) {
		return (
			await axios.post(
				`${this.url}/${useOrganizationStore.getState().organization
					?._id}/invite-resend?token=${token}&uiBaseURL=${window.location.origin}`,
				{
					token,
				},
			)
		).data;
	}

	static async removeMemberFromOrganization(userId: string) {
		return (
			await axios.delete(
				`${this.url}/${useOrganizationStore.getState().organization?._id}/member/${userId}`,
				{
					data: {},
				},
			)
		).data;
	}
	static async removeMultipleMembersFromOrganization(userIds: string[]) {
		return (
			await axios.post(
				`${this.url}/${useOrganizationStore.getState().organization?._id}/member/delete-multi`,
				{
					userIds,
				},
			)
		).data;
	}

	static async updateInvitationUserRole(token: string, role: string): Promise<Invitation> {
		return (
			await axios.put(
				`${this.url}/${useOrganizationStore.getState().organization?._id}/invite?token=${token}`,
				{
					role,
				},
			)
		).data;
	}

	static async changeMemberRole(userId: string, role: string): Promise<OrganizationMember> {
		return (
			await axios.put(
				`${this.url}/${useOrganizationStore.getState().organization?._id}/member/${userId}`,
				{
					role,
				},
			)
		).data;
	}

	static async getOrganizationApps(organizationId: string): Promise<Application[]> {
		return (await axios.get(`${this.url}/${organizationId}/app`)).data;
	}

	static async createApplication({
		orgId,
		name,
	}: CreateApplicationRequest): Promise<CreateApplicationResponse> {
		return (await axios.post(`${this.url}/${orgId}/app`, { name })).data;
	}

	static async deleteApplication(appId: string, orgId: string): Promise<void> {
		return (
			await axios.delete(`${this.url}/${orgId}/app/${appId}`, {
				data: {},
			})
		).data;
	}
	static async leaveAppTeam(appId: string, orgId: string): Promise<void> {
		return (
			await axios.delete(`${this.url}/${orgId}/app/${appId}/team`, {
				data: {},
			})
		).data;
	}

	static async getAllOrganizationRoleDefinitions(): Promise<OrgPermissions> {
		return (await axios.get(`${this.url}/roles`)).data;
	}
}
