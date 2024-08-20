import { ColumnDef } from "@tanstack/react-table";
import { Organization, OrgRoles, Project } from ".";

export type LoginParams = UserDataToRegister;

export interface APIError {
  error: string;
  details: string;
  code: string;
  fields?: {
    value: string;
    msg: string;
    param: string;
    location: string;
  }[];
  missingFields?: {
    name:
      | "provider"
      | "providerUserId"
      | "provider_user_id"
      | "email"
      | "phone"
      | "password"
      | "name"
      | "profilePicture"
      | "profile_picture"
      | "signUpAt"
      | "signup_at"
      | "lastLoginAt"
      | "last_login_at"
      | "emailVerified"
      | "email_verified"
      | "phoneVerified"
      | "phone_verified";
  }[];
  message?: string;
}
export type User = {
  iid: string;
  name: string;
  color: string;
  email: string;
  pictureUrl: string | null;
  canCreateOrg: boolean;
  isClusterOwner: boolean;
  notifications: string[];
  status: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
  provider: "github" | "gitlab" | "bitbucket";
  providerUserId: string;
  lastLoginAt: string;
  at: string;
  rt: string;
};

export interface UserDataToRegister {
  provider: "github" | "gitlab" | "bitbucket";
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  token?: string;
}

export interface OnboardingData {
  orgName: string;
  projectName: string;
  environmentName: string;
}

export interface UpdateNotificationData {
  notifications: string[];
}

export interface Types {
  orgRoles: string[];
  projectRoles: string[];
  bvlTypes: string[];
  databaseTypes: string[];
  instanceTypes: {
    engine: string[];
    database: string[];
    cache: string[];
    storage: string[];
    queue: string[];
    scheduler: string[];
    realtime: string[];
  };
  authUserDataModel: {
    name: string;
    type: string;
  }[];
}
export interface BaseGetRequest {
  page: number;
  size: number;
  sortBy?: string;
  sortDir?: string;
  start?: string;
  end?: string;
  search?: string;
}

export interface SortOption {
  name: string;
  value?: string;
  sortDir?: "asc" | "desc" | "";
}
export interface FormatOptionLabelProps<T> {
  label: string;
  value: T;
}

export interface Invitation {
  _id: string;
  orgId: string;
  name: string;
  token: string;
  role: string;
  status: "Pending" | "Active";
  link: string;
  host: {
    name: string;
    pictureUrl: string;
    color: string;
    email: string;
  };
  createdAt: string;
  orgRole?: OrgRoles;
  projectId?: string;
}

export interface GetInvitationRequest extends BaseGetRequest {
  name?: string;
  roles?: string[];
  status?: string;
  appId?: string;
  orgId?: string;
  projectId?: string;
}
export interface InvitationRequest {
  token?: string;
  tokens?: string[];
  appId?: string;
  orgId?: string;
  projectId?: string;
}
export interface UpdateRoleRequest {
  token?: string;
  userId?: string;
  role: string;
  appId?: string;
  orgId?: string;
  projectId?: string;
}
export interface RemoveMemberRequest {
  userId?: string;
  userIds?: string[];
  appId?: string;
  orgId?: string;
  projectId?: string;
}
export type RealtimeActionTypes =
  | "update"
  | "create"
  | "delete"
  | "telemetry"
  | "log"
  | "deploy"
  | "redeploy";
export type RealtimeObjectTypes =
  | "user"
  | "org"
  | "cluster"
  | "org.project"
  | "org.project.environment"
  | "org.project.environment.container"
  | "org.project.team"
  | "org.member";

export interface RealtimeIdentifiers {
  orgId?: string;
  appId?: string;
  userId?: string;
  environmentId?: string;
  projectId?: string;
  containerId?: string;
}
export interface RealtimeData<T> {
  actor: Partial<User> & { userId: string };
  action: RealtimeActionTypes;
  object: RealtimeObjectTypes;
  objectType: RealtimeObjectTypes;
  description: string;
  timestamp: string;
  data: T;
  identifiers: RealtimeIdentifiers;
  id: string;
  message: string;
  type: string;
}
export interface RealtimeActionParams<T> {
  data: T;
  identifiers: RealtimeIdentifiers;
  message?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  actor?: Partial<User> & { userId: string };
}

export type ColumnDefWithClassName<TData> = ColumnDef<TData> & {
  className?: string;
};

declare module "@tanstack/react-query" {
  //@ts-ignore
  export interface UseBaseMutationResult<D, APIError, V, C> {
    error: APIError | null;
  }
  interface Register {
    defaultError: APIError;
  }
}

export interface TransferRequest {
  projectId?: string;
  appId?: string;
  orgId?: string;
  userId: string;
}

export type NotificationActions =
  | "create"
  | "update"
  | "delete"
  | "deploy"
  | "redeploy";

export interface OrgAcceptInviteResponse {
  org: Organization;
  user: User;
  role: OrgRoles;
}
export interface ProjectAcceptInviteResponse {
  project: Project;
  user: User;
  role: OrgRoles;
}

export interface GetAuditLogsRequest extends BaseGetRequest {
  orgId: string;
  projectId?: string;
  envId?: string;
  actor?: string[];
  action?: NotificationActions[];
}

export interface GetDistinctActionsRequest {
  orgId: string;
  projectId?: string;
  envId?: string;
}

export interface Notification {
  _id: string;
  object: string;
  orgId: string;
  projectId: string;
  action: string;
  actor: Actor;
  description: string;
  createdAt: string;
}

export interface Actor {
  userId: string;
  name: string;
  pictureUrl: string;
  color: string;
  email: string;
}
