import useEnvironmentStore from '@/store/environment/environmentStore';
import { Environment as EnvType, RealtimeActionParams } from '@/types';
import { RealtimeActions } from './RealtimeActions';

class Environment implements RealtimeActions<EnvType> {
	redeploy(param: RealtimeActionParams<EnvType>): void {
		this.update(param);
	}
	deploy(param: RealtimeActionParams<EnvType>): void {
		this.update(param);
	}
	delete(param: RealtimeActionParams<EnvType>): void {
		useEnvironmentStore.setState?.({
			environments: useEnvironmentStore
				.getState?.()
				.environments.filter((env) => env._id !== param.identifiers.environmentId),
		});
	}
	update(param: RealtimeActionParams<EnvType>): void {
		useEnvironmentStore.setState?.({
			environments: useEnvironmentStore.getState?.().environments.map((env) => {
				if (env._id === param.data._id) {
					return param.data;
				}
				return env;
			}),
			environment: param.data,
		});
	}
	create(param: RealtimeActionParams<EnvType>): void {
		useEnvironmentStore.setState?.({
			environments: [...useEnvironmentStore.getState().environments, param.data],
		});
	}
	telemetry(param: RealtimeActionParams<EnvType>): void {
		this.update(param);
	}
	log(): void {
		return;
	}
}

export default Environment;
