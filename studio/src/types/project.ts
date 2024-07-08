import { z } from "zod";
import { Environment } from "./environment";
import { ChangeNameFormSchema, NameSchema } from "./schema";
import { UpdateRoleRequest } from "./type";

export enum ProjectRole {
  Admin = "Admin",
  Developer = "Developer",
  Viewer = "Viewer",
}

export interface CreateProjectResponse {
  project: Project;
  environment: Environment;
}

export interface Project {
  orgId: string;
  iid: string;
  ownerUserId: string;
  name: string;
  color: string;
  team: ProjectTeam[];
  createdBy: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
  pictureUrl: string;
  role: ProjectRole;
}

export interface ProjectTeam {
  userId: TeamMember;
  role: string;
  _id: string;
  joinDate: string;
}

export interface ProjectMember {
  _id: string;
  projectId: string;
  role: string;
  joinDate: string;
  member: TeamMember;
}

export interface TeamMember {
  _id: string;
  iid: string;
  name: string;
  color: string;
  contactEmail: string;
  "2fa": boolean;
  canCreateOrg: boolean;
  isClusterOwner: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  pictureUrl: string;
  isProjectOwner: boolean;
}
export interface ProjectRoleDefinition {
  Admin: Role;
  Developer: Role;
  Viewer: Role;
}

export interface Role {
  project: ProjectPermissions;
}

export interface ProjectPermissions {
  view: boolean;
  update: boolean;
  delete: boolean;
  transfer: boolean;
  viewLogs: boolean;
  invite: Permission;
  team: Permission;
  environment: Permission;
  container: Permission;
}

export interface Permission {
  view: boolean;
  create?: boolean;
  update: boolean;
  delete: boolean;
  resend?: boolean;
}

export const CreateProjectSchema = z.object({
  name: ChangeNameFormSchema.shape.name,
  envName: NameSchema,
});

export interface CreateProjectRequest
  extends z.infer<typeof CreateProjectSchema> {
  orgId: string;
}

export interface UpdateProjectParams {
  projectId: string;
  orgId: string;
}
export interface ProjectMemberRequest {
  name: string;
  role: ProjectRole | "";
  uiBaseURL: string;
}

export interface ProjectInviteRequest extends UpdateProjectParams {
  members: ProjectMemberRequest[];
  uiBaseURL: string;
}

export interface ChangeProjectNameRequest extends UpdateProjectParams {
  name: string;
}

export interface SetProjectAvatarRequest extends UpdateProjectParams {
  picture: File;
}

export type UpdateProjectMemberRoleRequest = UpdateProjectParams &
  UpdateRoleRequest;
