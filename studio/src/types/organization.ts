import { ChangeNameFormSchema } from ".";

export type OrgRoles = "Admin" | "Member";
export interface Organization {
  _id: string;
  ownerUserId: string;
  iid: string;
  name: string;
  color: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  pictureUrl: string;
  updatedBy: string;
  __v: number;
  role: OrgRoles;
}
export interface CreateOrganizationRequest {
  name: string;
}
export interface LeaveOrganizationRequest {
  organizationId: string;
}

export const CreateOrganizationSchema = ChangeNameFormSchema;
export interface ChangeOrganizationNameRequest {
  name: string;
  organizationId: string;
}

export interface ChangeOrganizationAvatarRequest {
  organizationId: string;
  picture: File;
}

export interface GetOrganizationMembersRequest {
  roles?: string[];
  sortBy?: string;
  sortDir?: string;
  start?: string;
  end?: string;
  search?: string;
  organizationId: string;
  excludeSelf?: boolean;
}

export interface OrganizationMember {
  _id: string;
  orgId: string;
  role: string;
  joinDate: string;
  member: {
    _id: string;
    iid: string;
    color: string;
    contactEmail: string;
    name: string;
    pictureUrl: string;
    loginEmail: string;
    isOrgOwner: boolean;
  };
}
export interface OrgMemberRequest {
  name: string;
  role: OrgRoles | "";
}
export interface InviteOrgRequest {
  members: OrgMemberRequest[];
  organizationId: string;
  uiBaseURL: string;
}

export interface RemoveMemberFromOrganizationRequest {
  userId?: string;
  userIds?: string[];
}
export interface OrgRoleDefinition {
  update: boolean;
  delete: boolean;
  transfer: boolean;
  viewLogs: boolean;
  invite: {
    view: boolean;
    create: boolean;
    update: boolean;
    resend: boolean;
    delete: boolean;
  };
  member: {
    view: boolean;
    update: boolean;
    delete: boolean;
  };
  app: {
    view: boolean;
    viewAll: boolean;
    create: boolean;
    update: boolean;
  };
  resource: {
    view: boolean;
    add: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
}
export interface OrgRolePermissions {
  org: OrgRoleDefinition;
}
export interface OrgPermissions {
  Admin: OrgRolePermissions;
  Member: OrgRolePermissions;
}
