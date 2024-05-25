import useAuthStore from "@/store/auth/authStore";
import useProjectStore from "@/store/project/projectStore";
import { AppRoles, Project, RealtimeActionParams } from "@/types";
import { history } from "@/utils";
import { RealtimeActions } from "./RealtimeActions";
class ProjectTeam implements RealtimeActions<Project> {
  delete({ data }: RealtimeActionParams<Project>) {
    const team = data?.team.filter((member) => member.userId._id !== data._id);
    const user = useAuthStore.getState()?.user;

    if (!team.some((member) => member.userId._id === user?._id)) {
      useProjectStore.setState?.((state) => ({
        ...state,
        projects: state.projects.filter((project) => project._id !== data._id),
        project: {} as Project,
      }));
      history.navigate?.(`/organization/${data.orgId}/apps`);
    } else {
      useProjectStore.setState((prev) => ({
        ...prev,
        projects: prev.projects.map((project) => {
          if (project._id === data._id) {
            return {
              ...project,
              team,
            };
          }
          return project;
        }),
        projectTeam: team.map((member) => ({
          ...member,
          projectId: data._id,
          member: member.userId,
        })),
      }));
    }

    useProjectStore.getState().closeEnvironmentDrawer();
  }

  update({ data }: RealtimeActionParams<Project>) {
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
  telemetry(params: RealtimeActionParams<Project>) {
    this.update(params);
  }
}
export default ProjectTeam;
