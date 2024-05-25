import { UI_BASE_URL } from '@/constants';
import { axios } from '@/helpers';
import {
	GetInvitationRequest,
	Invitation,
	InvitationRequest,
	RemoveMemberRequest,
	TransferRequest,
	UpdateRoleRequest,
} from '@/types';
import {
	ChangeProjectNameRequest,
	CreateProjectRequest,
	CreateProjectResponse,
	Project,
	ProjectInviteRequest,
	ProjectMember,
	ProjectRoleDefinition,
	SetProjectAvatarRequest,
	UpdateProjectMemberRoleRequest,
	UpdateProjectParams,
} from '@/types/project';
import { arrayToQueryString } from '@/utils';

export default class ProjectService {
	static readonly url = '/v1/org/:orgId/project/:projectId';

	static getUrl(orgId: string, projectId: string) {
		return this.url.replace(':orgId', orgId).replace(':projectId', projectId);
	}
	static async getProjectById(orgId: string, projectId: string): Promise<Project> {
		return (await axios.get(`v1/org/${orgId}/project/${projectId}`)).data;
	}
	static async createProject(req: CreateProjectRequest): Promise<CreateProjectResponse> {
		return (await axios.post(`v1/org/${req.orgId}/project`, req)).data;
	}
	static async getProjects(orgId: string): Promise<Project[]> {
		return (await axios.get(`v1/org/${orgId}/project`)).data;
	}

	static async getAllProjects(orgId: string): Promise<Project[]> {
		return (await axios.get(`v1/org/${orgId}/project/all`)).data;
	}

	static async getProjectRoleDefinitions(orgId: string): Promise<ProjectRoleDefinition> {
		return (await axios.get(`v1/org/${orgId}/project/roles`)).data;
	}

	static async deleteProject(orgId: string, projectId: string) {
		return (await axios.delete(`v1/org/${orgId}/project/${projectId}`, { data: {} })).data;
	}

	static async leaveProjectTeam(orgId: string, projectId: string) {
		return (await axios.delete(`v1/org/${orgId}/project/${projectId}/team`, { data: {} })).data;
	}
	static async inviteUsersToProject(req: ProjectInviteRequest): Promise<Invitation[]> {
		return (
			await axios.post(
				`${this.getUrl(req.orgId, req.projectId)}/invite?uiBaseURL=${req.uiBaseURL}`,
				req.members,
			)
		).data;
	}

	static async getProjectTeam(req: UpdateProjectParams): Promise<ProjectMember[]> {
		return (await axios.get(`${this.getUrl(req.orgId, req.projectId)}/team`)).data;
	}

	static async changeProjectName(req: ChangeProjectNameRequest): Promise<Project> {
		return (await axios.put(`${this.getUrl(req.orgId, req.projectId)}`, { name: req.name })).data;
	}
	static async setProjectAvatar(req: SetProjectAvatarRequest): Promise<Project> {
		const formData = new FormData();
		formData.append('picture', req.picture, req.picture.name);
		return (
			await axios.put(`${this.getUrl(req.orgId, req.projectId)}/picture`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			})
		).data;
	}
	static async removeProjectAvatar(req: UpdateProjectParams): Promise<Project> {
		return (await axios.delete(`${this.getUrl(req.orgId, req.projectId)}/picture`)).data;
	}

	static async transferProjectOwnership(req: TransferRequest): Promise<Project> {
		return (
			await axios.post(
				`${this.getUrl(req?.orgId as string, req.projectId as string)}/transfer/${req.userId}`,
				{
					userId: req.userId,
				},
			)
		).data;
	}

	static async removeProjectMember(req: RemoveMemberRequest) {
		return (
			await axios.delete(
				`${this.getUrl(req.orgId as string, req.projectId as string)}/team/${req.userId}`,
				{
					data: {},
				},
			)
		).data;
	}
	static async removeMultipleProjectMembers(req: RemoveMemberRequest): Promise<void> {
		return (
			await axios.post(
				`${this.getUrl(req.orgId as string, req.projectId as string)}/team/delete-multi`,
				{
					userIds: req.userIds,
				},
			)
		).data;
	}

	static async updateProjectMemberRole(
		req: UpdateProjectMemberRoleRequest,
	): Promise<ProjectMember> {
		return (
			await axios.put(`${this.getUrl(req.orgId, req.projectId)}/team/${req.userId}`, {
				role: req.role,
			})
		).data;
	}

	static async getProjectInvitations(req: GetInvitationRequest): Promise<Invitation[]> {
		const { roles, ...params } = req;
		const role = arrayToQueryString(roles as string[], 'role');
		return (
			await axios.get(
				`${this.getUrl(req.orgId as string, req.projectId as string)}/invite?${role}`,
				{
					params,
				},
			)
		).data;
	}

	static async resendInvitation(req: InvitationRequest): Promise<Invitation> {
		return (
			await axios.post(
				`${this.getUrl(req.orgId as string, req.projectId as string)}/invite/resend?token=${
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
				`${this.getUrl(req.orgId as string, req.projectId as string)}/invite?token=${req.token}`,
				{
					role: req.role,
				},
			)
		).data;
	}
	static async deleteInvitation(req: InvitationRequest): Promise<Invitation> {
		return (
			await axios.delete(
				`${this.getUrl(req.orgId as string, req.projectId as string)}/invite?token=${req.token}`,
				{
					data: {},
				},
			)
		).data;
	}

	static async deleteMultipleInvitations(req: InvitationRequest): Promise<Invitation[]> {
		return (
			await axios.delete(
				`${this.getUrl(req.orgId as string, req.projectId as string)}/invite/multi`,
				{
					data: {
						tokens: req.tokens,
					},
				},
			)
		).data;
	}
}
