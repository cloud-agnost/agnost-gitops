import useApplicationStore from '@/store/app/applicationStore';
import useAuthStore from '@/store/auth/authStore';
import { AppRoles, Application, RealtimeActionParams } from '@/types';
import { history } from '@/utils';
import { RealtimeActions } from './RealtimeActions';
class ApplicationTeam implements RealtimeActions<Application> {
	delete({ data }: RealtimeActionParams<Application>) {
		const team = data?.team.filter((member) => member.userId._id !== data._id);
		const user = useAuthStore.getState()?.user;

		if (!team.some((member) => member.userId._id === user?._id)) {
			useApplicationStore.setState?.({
				application: null,
				applications: useApplicationStore
					.getState?.()
					.applications.filter((app) => app._id !== data._id),
			});
			history.navigate?.(`/organization/${data.orgId}/apps`);
		} else {
			useApplicationStore.setState((prev) => ({
				...prev,
				applications: prev.applications.map((app) => {
					if (app._id === data._id) {
						return {
							...app,
							team,
						};
					}
					return app;
				}),
				applicationTeam: team.map((member) => ({
					...member,
					appId: data._id,
					member: member.userId,
				})),
			}));
		}

		useApplicationStore.getState().closeVersionDrawer();
	}

	update({ data }: RealtimeActionParams<Application>) {
		const user = useAuthStore.getState()?.user;
		const role = data.team.find((team) => team.userId._id === user?._id)?.role;
		useApplicationStore.setState?.({
			application: {
				...data,
				role: role as AppRoles,
			},
			applications: useApplicationStore.getState?.().applications.map((app) => {
				if (app._id === data._id) {
					return {
						...data,
						role: role as AppRoles,
					};
				}
				return app;
			}),
			applicationTeam: data.team.map((member) => ({
				...member,
				appId: data._id,
				member: member.userId,
			})),
		});
	}
	telemetry(params: RealtimeActionParams<Application>) {
		this.update(params);
	}
}
export default ApplicationTeam;
