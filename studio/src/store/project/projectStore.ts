import ProjectService from "@/services/ProjectService";
import {
  APIError,
  ChangeProjectNameRequest,
  CreateProjectRequest,
  Environment,
  GetInvitationRequest,
  Invitation,
  InvitationRequest,
  Project,
  ProjectInviteRequest,
  ProjectMember,
  ProjectRole,
  ProjectRoleDefinition,
  RemoveMemberRequest,
  SetProjectAvatarRequest,
  TransferRequest,
  UpdateProjectMemberRoleRequest,
  UpdateProjectParams,
  UpdateRoleRequest,
} from "@/types";

import { joinChannel, leaveChannel, resetAfterProjectChange } from "@/utils";
import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import useAuthStore from "../auth/authStore";
import useEnvironmentStore from "../environment/environmentStore";
import useOrganizationStore from "../organization/organizationStore";

interface ProjectState {
  projectAuthorization: ProjectRoleDefinition;
  projects: Project[];
  project: Project;
  toDeleteProject: Project | undefined;
  Environments: Environment[];
  isDeleteModalOpen: boolean;
  isLeaveModalOpen: boolean;
  isInviteMemberModalOpen: boolean;
  isEditProjectOpen: boolean;
  projectTeam: ProjectMember[];
  tempTeam: ProjectMember[];
  lastFetchedInvitationsPage: number;
  invitations: Invitation[];
  isEnvOpen: boolean;
  loading: boolean;
}

type Actions = {
  getProjectById: (orgId: string, projectId: string) => Promise<Project>;
  getProjectPermissions: (orgId: string) => Promise<ProjectRoleDefinition>;
  createProject: (req: CreateProjectRequest) => Promise<Project>;
  getProjects: (orgId: string) => Promise<Project[]>;
  deleteProject: (orgId: string, projectId: string) => Promise<void>;
  leaveProjectTeam: (orgId: string, projectId: string) => Promise<void>;
  selectProject: (project: Project) => void;
  inviteUsersToProject: (req: ProjectInviteRequest) => Promise<Invitation[]>;
  getProjectTeam: (req: UpdateProjectParams) => Promise<ProjectMember[]>;
  changeProjectName: (req: ChangeProjectNameRequest) => Promise<Project>;
  setProjectAvatar: (req: SetProjectAvatarRequest) => Promise<Project>;
  removeProjectAvatar: (req: UpdateProjectParams) => Promise<Project>;
  transferProjectOwnership: (req: TransferRequest) => Promise<Project>;
  openDeleteModal: (project: Project) => void;
  openLeaveModal: (project: Project) => void;
  closeLeaveModal: () => void;
  closeDeleteModal: () => void;
  openInviteMemberModal: (project: Project) => void;
  closeInviteMemberModal: () => void;
  openEditProjectDrawer: (project: Project) => void;
  closeEditProjectDrawer: (clearProject?: boolean) => void;
  removeProjectMember: (req: RemoveMemberRequest) => Promise<void>;
  removeMultipleProjectMembers: (req: RemoveMemberRequest) => Promise<void>;
  changeProjectTeamRole: (
    req: UpdateProjectMemberRoleRequest
  ) => Promise<ProjectMember>;
  getProjectInvitations: (req: GetInvitationRequest) => Promise<Invitation[]>;
  resendInvitation: (req: InvitationRequest) => Promise<void>;
  updateInvitationUserRole: (req: UpdateRoleRequest) => Promise<Invitation>;
  deleteInvitation: (req: InvitationRequest) => Promise<void>;
  deleteMultipleInvitations: (req: InvitationRequest) => Promise<void>;
  openEnvironmentDrawer: () => void;
  closeEnvironmentDrawer: (clearProject?: boolean) => void;
  onProjectClick: (project: Project) => void;
  reset: () => void;
};

const initialState: ProjectState = {
  projectAuthorization: {} as ProjectRoleDefinition,
  projects: [],
  project: {} as Project,
  Environments: [],
  isDeleteModalOpen: false,
  toDeleteProject: undefined,
  isLeaveModalOpen: false,
  isInviteMemberModalOpen: false,
  isEditProjectOpen: false,
  projectTeam: [],
  tempTeam: [],
  lastFetchedInvitationsPage: 0,
  invitations: [],
  isEnvOpen: false,
  loading: false,
};

const useProjectStore = create<ProjectState & Actions>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        ...initialState,
        getProjectById: async (orgId: string, projectId: string) => {
          const project = await ProjectService.getProjectById(orgId, projectId);
          get().selectProject(project);
          if (project._id !== projectId) resetAfterProjectChange();
          return project;
        },
        getProjectPermissions: async (orgId: string) => {
          const projectAuthorization = await ProjectService.getProjectRoleDefinitions(
            orgId
          );
          set({ projectAuthorization });
          return projectAuthorization;
        },
        createProject: async (req: CreateProjectRequest) => {
          const { project } = await ProjectService.createProject(req);
          set((state) => ({
            projects: [...state.projects, project],
          }));
          return project;
        },
        getProjects: async (orgId: string) => {
          const projects = await ProjectService.getProjects(orgId);
          set({ projects });
          return projects;
        },
        deleteProject: async (orgId: string, projectId: string) => {
          await ProjectService.deleteProject(orgId, projectId);
          set((state) => ({
            projects: state.projects.filter(
              (project) => project._id !== projectId
            ),
            project: undefined,
          }));
          resetAfterProjectChange();
        },
        openDeleteModal: (project: Project) =>
          set({ isDeleteModalOpen: true, toDeleteProject: project }),
        closeDeleteModal: () =>
          set({ isDeleteModalOpen: false, toDeleteProject: undefined }),
        openLeaveModal: (project: Project) =>
          set({ isLeaveModalOpen: true, toDeleteProject: project }),
        closeLeaveModal: () =>
          set({ isLeaveModalOpen: false, toDeleteProject: undefined }),
        leaveProjectTeam: async (orgId: string, projectId: string) => {
          await ProjectService.leaveProjectTeam(orgId, projectId);
          set((state) => ({
            projects: state.projects.filter(
              (project) => project._id !== projectId
            ),
          }));
          leaveChannel(projectId);
        },

        selectProject: (project: Project) => {
          const user = useAuthStore.getState()?.user;
          const role = user.isClusterOwner
            ? ProjectRole.Admin
            : (project?.team.find((t) => t.userId._id === user?._id)
                ?.role as ProjectRole);

          set({
            project: {
              ...project,
              role,
            },
          });
          joinChannel(project._id);
        },
        inviteUsersToProject: async (req: ProjectInviteRequest) => {
          const invitations = await ProjectService.inviteUsersToProject(req);
          set((prevState) => ({
            invitations: [...prevState.invitations, ...invitations],
          }));
          return invitations;
        },
        openInviteMemberModal: (project: Project) => {
          get().selectProject(project);
          set({
            isInviteMemberModalOpen: true,
          });
        },
        closeInviteMemberModal: () => {
          set({
            isInviteMemberModalOpen: false,
          });
        },
        openEditProjectDrawer: (project: Project) => {
          set({
            isEditProjectOpen: true,
          });
          get().selectProject(project);
        },
        closeEditProjectDrawer: (clearProject = false) => {
          set({
            isEditProjectOpen: false,
            isEnvOpen: false,
            ...(clearProject && { project: undefined }),
          });
          const searchParams = new URLSearchParams(window.location.search);
          searchParams.delete("t");
          searchParams.delete("r");
          searchParams.delete("e");
          searchParams.delete("s");
          searchParams.delete("d");
          window.history.replaceState({}, "", `${window.location.pathname}`);
        },
        getProjectTeam: async (req: UpdateProjectParams) => {
          const projectTeam = await ProjectService.getProjectTeam(req);
          set({
            projectTeam,
            tempTeam: projectTeam,
          });
          return projectTeam;
        },
        changeProjectName: async (req: ChangeProjectNameRequest) => {
          const project = await ProjectService.changeProjectName(req);
          set((state) => ({
            projects: state.projects.map((p) =>
              p._id === project._id ? project : p
            ),
          }));
          get().selectProject(project);
          return project;
        },
        setProjectAvatar: async (req: SetProjectAvatarRequest) => {
          const project = await ProjectService.setProjectAvatar(req);
          set((state) => ({
            projects: state.projects.map((p) =>
              p._id === project._id ? project : p
            ),
          }));
          get().selectProject(project);
          return project;
        },
        removeProjectAvatar: async (req: UpdateProjectParams) => {
          const project = await ProjectService.removeProjectAvatar(req);
          set((state) => ({
            projects: state.projects.map((p) =>
              p._id === project._id ? project : p
            ),
          }));
          get().selectProject(project);
          return project;
        },
        transferProjectOwnership: async (req: TransferRequest) => {
          const project = await ProjectService.transferProjectOwnership(req);
          set((state) => ({
            projects: state.projects.map((p) =>
              p._id === project._id ? project : p
            ),
          }));
          get().selectProject(project);
          return project;
        },
        removeProjectMember: async (req: RemoveMemberRequest) => {
          try {
            await ProjectService.removeProjectMember(req);
            set({
              projectTeam: get().projectTeam.filter(
                (team) => team.member._id !== req.userId
              ),
            });
          } catch (error) {
            throw error as APIError;
          }
        },
        removeMultipleProjectMembers: async (req: RemoveMemberRequest) => {
          try {
            await ProjectService.removeMultipleProjectMembers(req);
            set({
              projectTeam: get().projectTeam.filter(
                (team) => !req.userIds?.includes(team.member._id)
              ),
            });
          } catch (error) {
            throw error as APIError;
          }
        },
        changeProjectTeamRole: async (req: UpdateProjectMemberRoleRequest) => {
          const { userId, role } = req;
          try {
            const member = await ProjectService.updateProjectMemberRole(req);
            set({
              projectTeam: get().projectTeam.map((team) => {
                if (team.member._id === userId) {
                  team.role = role;
                }
                return team;
              }),
            });

            return member;
          } catch (error) {
            throw error as APIError;
          }
        },
        resendInvitation: async (req: InvitationRequest) => {
          try {
            await ProjectService.resendInvitation(req);
          } catch (error) {
            throw error as APIError;
          }
        },
        deleteInvitation: async (req: InvitationRequest) => {
          try {
            await ProjectService.deleteInvitation(req);
            set({
              invitations: get().invitations.filter(
                (invitation) => invitation.token !== req.token
              ),
            });
          } catch (error) {
            throw error as APIError;
          }
        },
        deleteMultipleInvitations: async (req: InvitationRequest) => {
          try {
            await ProjectService.deleteMultipleInvitations(req);
            set({
              invitations: get().invitations.filter(
                (invitation) => !req.tokens?.includes(invitation.token)
              ),
            });
          } catch (error) {
            throw error as APIError;
          }
        },
        updateInvitationUserRole: async (req: UpdateRoleRequest) => {
          try {
            const invitation = await ProjectService.updateInvitationUserRole(
              req
            );
            set({
              invitations: get().invitations.map((invitation) => {
                if (invitation.token === req.token) {
                  invitation.role = req.role;
                }
                return invitation;
              }),
            });

            return invitation;
          } catch (error) {
            throw error as APIError;
          }
        },
        getProjectInvitations: async (req: GetInvitationRequest) => {
          try {
            const invitations = await ProjectService.getProjectInvitations(req);
            if (req.page === 0) set({ invitations });
            else
              set({
                invitations: [...invitations, ...get().invitations],
                lastFetchedInvitationsPage: req.page,
              });
            return invitations;
          } catch (error) {
            throw error as APIError;
          }
        },
        openEnvironmentDrawer: () => {
          set({
            isEnvOpen: true,
          });
        },
        closeEnvironmentDrawer: (clearProject = false) => {
          set({
            isEnvOpen: false,
            ...(clearProject && { project: undefined }),
          });
        },
        onProjectClick: async (project: Project) => {
          const { selectProject, openEnvironmentDrawer } = get();
          selectProject(project);
          set({ loading: true });
          const {
            selectEnvironment,
            getEnvironments,
          } = useEnvironmentStore.getState();
          const orgId = useOrganizationStore.getState().organization
            ?._id as string;
          const environments = await getEnvironments({
            orgId,
            projectId: project._id,
          });

          if (environments.length === 1) {
            selectEnvironment(environments[0]);
          } else {
            openEnvironmentDrawer();
          }
          set({ loading: false });
        },
        reset: () => {
          set((state) => ({
            ...initialState,
            projectAuthorization: state.projectAuthorization,
          }));
        },
      })),
      {
        name: "projectStore",
        partialize: (state) => ({
          projectAuthorization: state.projectAuthorization,
        }),
      }
    )
  )
);

export default useProjectStore;
