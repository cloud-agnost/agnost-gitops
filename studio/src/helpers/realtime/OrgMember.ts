import useApplicationStore from '@/store/app/applicationStore';
import useAuthStore from '@/store/auth/authStore';
import useOrganizationStore from '@/store/organization/organizationStore';
import { OrgRoles, Organization, OrganizationMember, RealtimeActionParams } from '@/types';
import { history } from '@/utils';
import { RealtimeActions } from './RealtimeActions';
class OrgMember implements RealtimeActions<OrganizationMember> {
	delete(param: RealtimeActionParams<OrganizationMember & { userIds: string[] }>): void {
		useOrganizationStore.setState?.({
			members: useOrganizationStore
				.getState?.()
				.members.filter((member) => member.member._id !== param.data._id),
		});
		if (
			param.data._id === useAuthStore.getState().user?._id ||
			param.data.userIds?.includes(useAuthStore.getState().user?._id as string)
		) {
			useOrganizationStore.setState?.({
				organization: {} as Organization,
				members: [],
				organizations: useOrganizationStore
					.getState()
					.organizations.filter((org) => org._id !== param.identifiers.orgId),
			});
			history.navigate?.('/organization');
		} else {
			useApplicationStore.setState?.((prev) => ({
				...prev,
				applicationTeam: prev.applicationTeam.filter((team) => team.member._id !== param.data._id),
				applications: prev.applications.map((app) => ({
					...app,
					team: app.team.filter((team) => team.userId._id !== param.data._id),
				})),
			}));
		}
	}
	update(param: RealtimeActionParams<OrganizationMember>): void {
		useOrganizationStore.setState?.({
			members: useOrganizationStore.getState?.().members.map((member) => {
				if (member.member._id === param.data._id) {
					return param.data;
				}
				return member;
			}),
		});
		if (param.data.member._id === useAuthStore.getState().user?._id) {
			useOrganizationStore.setState?.({
				organization: {
					...useOrganizationStore.getState().organization,
					role: param.data.role as OrgRoles,
				},
				organizations: useOrganizationStore.getState().organizations.map((org) => {
					if (org._id === param.data.orgId) {
						return {
							...org,
							role: param.data.role as OrgRoles,
						};
					}
					return org;
				}),
			});
		}
	}
}
export default OrgMember;
