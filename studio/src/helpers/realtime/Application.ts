import useApplicationStore from '@/store/app/applicationStore';
import useAuthStore from '@/store/auth/authStore';
import {
	AppRoles,
	Application as ApplicationType,
	CreateApplicationResponse,
	RealtimeActionParams,
} from '@/types';
import { history } from '@/utils';
import { RealtimeActions } from './RealtimeActions';
class Application implements RealtimeActions<ApplicationType | CreateApplicationResponse> {
	accept(param: RealtimeActionParams<ApplicationType>): void {
		this.update(param);
	}
	delete({ identifiers, actor }: RealtimeActionParams<ApplicationType>) {
		const { user } = useAuthStore.getState();
		useApplicationStore.setState?.({
			applications: useApplicationStore
				.getState?.()
				.applications.filter((app) => app._id !== identifiers.appId),
		});

		if (
			user?._id !== actor?._id &&
			window.location.pathname.includes(identifiers.appId as string)
		) {
			history.navigate?.(`/organization/${identifiers.orgId}/apps`);
		}
	}

	update({ data }: RealtimeActionParams<ApplicationType>) {
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
	create({ data }: RealtimeActionParams<CreateApplicationResponse>) {
		useApplicationStore.setState((prev) => ({
			applications: [...prev.applications, data.app],
		}));
	}
	telemetry(params: RealtimeActionParams<ApplicationType>) {
		this.update(params);
	}
}
export default Application;
