import { ColumnDef } from "@tanstack/react-table";
import { OrgRoles } from ".";
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
}
export type User = {
  iid: string;
  name: string;
  color: string;
  contactEmail: string;
  "2fa": boolean;
  pictureUrl: string | null;
  canCreateOrg: boolean;
  isClusterOwner: boolean;
  loginProfiles: {
    provider: string;
    id: string;
    email: string;
    emailVerified: boolean;
    _id: string;
  }[];
  notifications: string[];
  status: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
  at: string;
  rt: string;
};

export interface UserDataToRegister {
  name: string;
  email: string;
  password: string;
}

export interface OnboardingData {
  orgName: string;
  projectName: string;
  envName: string;
  uiBaseURL: string;
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
  email: string;
  token: string;
  role: string;
  status: "Pending" | "Active";
  createdAt: string;
  orgRole?: OrgRoles;
  appId?: string;
}

export interface GetInvitationRequest extends BaseGetRequest {
  email?: string;
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
  | "org.resource"
  | "cluster"
  | "resource"
  | "org.resource.log"
  | "org.project"
  | "org.project.environment"
  | "org.project.environment.container"
  | "org.project.team"
  | "org.member";

export interface RealtimeIdentifiers {
  orgId?: string;
  appId?: string;
  userId?: string;
  resourceId?: string;
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
