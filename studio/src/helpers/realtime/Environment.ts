import useAuthStore from "@/store/auth/authStore";
import useEnvironmentStore from "@/store/environment/environmentStore";
import { Environment as EnvironmentType, RealtimeActionParams } from "@/types";
import { history } from "@/utils";
import { RealtimeActions } from "./RealtimeActions";
class Environment implements RealtimeActions<EnvironmentType> {
  redeploy(param: RealtimeActionParams<EnvironmentType>): void {
    this.update(param);
  }
  deploy(param: RealtimeActionParams<EnvironmentType>): void {
    this.update(param);
  }
  delete(param: RealtimeActionParams<EnvironmentType>): void {
    const { user } = useAuthStore.getState();

    useEnvironmentStore.setState?.((state) => ({
      ...state,
      environments: state.environments.filter(
        (environment) => environment._id !== param.identifiers.environmentId
      ),
    }));

    if (
      user?._id !== param.actor?._id &&
      window.location.pathname.includes(
        param?.identifiers?.environmentId as string
      )
    ) {
      history.navigate?.(`/organization/${param.identifiers.orgId}/projects`);
    }
  }
  update(param: RealtimeActionParams<EnvironmentType>): void {
    useEnvironmentStore.setState?.((state) => ({
      ...state,
      environments: state.environments.map((environment) => {
        if (environment._id === param.data._id) {
          return param.data;
        }
        return environment;
      }),
      environment: param.data,
    }));
  }
  create(param: RealtimeActionParams<EnvironmentType>): void {
    useEnvironmentStore.setState?.((state) => ({
      ...state,
      environments: [...state.environments, param.data],
    }));
  }
  telemetry(param: RealtimeActionParams<EnvironmentType>): void {
    this.update(param);
  }
  log(): void {
    return;
  }
}

export default Environment;
