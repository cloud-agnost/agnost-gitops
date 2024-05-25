import useAuthStore from '@/store/auth/authStore';
import useVersionStore from '@/store/version/versionStore';
import { RealtimeActionParams, Version as VersionType } from '@/types';
import { history } from '@/utils';
import { RealtimeActions } from './RealtimeActions';
class Version implements RealtimeActions<VersionType> {
	redeploy(param: RealtimeActionParams<VersionType>): void {
		this.update(param);
	}
	deploy(param: RealtimeActionParams<VersionType>): void {
		this.update(param);
	}
	delete(param: RealtimeActionParams<VersionType>): void {
		const { user } = useAuthStore.getState();
		useVersionStore.setState?.({
			versions: useVersionStore
				.getState?.()
				.versions.filter((env) => env._id !== param.identifiers.environmentId),
		});

		if (
			user?._id !== param.actor?._id &&
			window.location.pathname.includes(param?.identifiers?.versionId as string)
		) {
			history.navigate?.(`/organization/${param.identifiers.orgId}/apps`);
		}
	}
	update(param: RealtimeActionParams<VersionType>): void {
		useVersionStore.setState?.((prev) => ({
			versions: prev.versions.map((version) => {
				if (version._id === param.data._id) {
					return param.data;
				}
				return version;
			}),
			version: param.data,
		}));
	}
	create(param: RealtimeActionParams<VersionType>): void {
		useVersionStore.setState?.({
			versions: [...useVersionStore.getState().versions, param.data],
		});
	}
	telemetry(param: RealtimeActionParams<VersionType>): void {
		this.update(param);
	}
	log(): void {
		return;
	}
}

export default Version;
