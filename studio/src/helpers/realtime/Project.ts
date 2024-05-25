import useAuthStore from "@/store/auth/authStore";
import useProjectStore from "@/store/project/projectStore";
import {
  AppRoles,
  CreateProjectResponse,
  Project as ProjectType,
  RealtimeActionParams,
} from "@/types";
import { history } from "@/utils";
import { RealtimeActions } from "./RealtimeActions";
class Project implements RealtimeActions<ProjectType | CreateProjectResponse> {
  accept(param: RealtimeActionParams<ProjectType>): void {
    this.update(param);
  }
  delete({ identifiers, actor }: RealtimeActionParams<ProjectType>) {
    const { user } = useAuthStore.getState();

    useProjectStore.setState?.((state) => ({
      ...state,
      projects: state.projects.filter(
        (project) => project._id !== identifiers.projectId
      ),
    }));

    if (
      user?._id !== actor?._id &&
      window.location.pathname.includes(identifiers.projectId as string)
    ) {
      history.navigate?.(`/organization/${identifiers.orgId}/apps`);
    }
  }

  update({ data }: RealtimeActionParams<ProjectType>) {
    const user = useAuthStore.getState()?.user;
    const role = data.team.find((team) => team.userId._id === user?._id)?.role;
    useProjectStore.setState?.((state) => ({
      ...state,
      projects: state.projects.map((project) => {
        if (project._id === data._id) {
          return {
            ...data,
            role: role as AppRoles,
          };
        }
        return project;
      }),
      project: {
        ...data,
        role: role as AppRoles,
      },
      projectTeam: data.team.map((member) => ({
        ...member,
        projectId: data._id,
        member: member.userId,
      })),
    }));
  }
  create({ data }: RealtimeActionParams<CreateProjectResponse>) {
    useProjectStore.setState?.((state) => ({
      ...state,
      projects: [...state.projects, data.project],
    }));
  }
  telemetry(params: RealtimeActionParams<ProjectType>) {
    this.update(params);
  }
}
export default Project;
