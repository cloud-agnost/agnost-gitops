import useAuthStore from "@/store/auth/authStore";
import useProjectEnvironmentStore from "@/store/project/projectEnvironmentStore";
import {
  ProjectEnvironment as ProjectEnvironmentType,
  RealtimeActionParams,
} from "@/types";
import { history } from "@/utils";
import { RealtimeActions } from "./RealtimeActions";
class ProjectEnvironment implements RealtimeActions<ProjectEnvironmentType> {
  redeploy(param: RealtimeActionParams<ProjectEnvironmentType>): void {
    this.update(param);
  }
  deploy(param: RealtimeActionParams<ProjectEnvironmentType>): void {
    this.update(param);
  }
  delete(param: RealtimeActionParams<ProjectEnvironmentType>): void {
    const { user } = useAuthStore.getState();

    useProjectEnvironmentStore.setState?.((state) => ({
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
      history.navigate?.(`/organization/${param.identifiers.orgId}/apps`);
    }
  }
  update(param: RealtimeActionParams<ProjectEnvironmentType>): void {
    useProjectEnvironmentStore.setState?.((state) => ({
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
  create(param: RealtimeActionParams<ProjectEnvironmentType>): void {
    useProjectEnvironmentStore.setState?.((state) => ({
      ...state,
      environments: [...state.environments, param.data],
    }));
  }
  telemetry(param: RealtimeActionParams<ProjectEnvironmentType>): void {
    this.update(param);
  }
  log(): void {
    return;
  }
}

export default ProjectEnvironment;
