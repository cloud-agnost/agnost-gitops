import { ColumnDef } from "@tanstack/react-table";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { z } from "zod";
import { OrgRoles } from ".";
import { EnvironmentStatus } from "./environment";
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
    type:
      | "text"
      | "boolean"
      | "datetime"
      | "link"
      | "encrypted-text"
      | "array"
      | "phone"
      | "email";
  }[];
}
export type User = {
  iid: string;
  name: string;
  color: string;
  
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
  editorSettings: Partial<monaco.editor.IStandaloneEditorConstructionOptions>;
  at: string;
  rt: string;
};

export interface UserDataToRegister extends BaseRequest {
  name: string;
  email: string;
  password: string;
}

export interface OnboardingData {
  orgName: string;
  appName: string;
  uiBaseURL: string;
  smtp: SMTPSettings;
  appMembers: AppMembers[];
}

export interface SMTPSettings {
  host: string;
  port: number;
  useTLS: boolean;
  user: string;
  password: string;
}

export interface AppMembers {
  email?: string;
  role?: "Admin" | "Developer" | "Viewer" | "";
}

export interface CompleteAccountSetupRequest {
  email: string | undefined;
  token: string;
  inviteType: "org" | "app";
  name: string;
  password: string;
}

export interface FinalizeAccountSetupRequest {
  email: string | undefined;
  verificationCode: number;
  password: string;
  name: string;
}
export interface BaseRequest {
  onSuccess?: (data?: any) => void;
  onError?: (err: APIError) => void;
}

export interface UpdateNotificationData {
  notifications: string[];
}

export enum PhoneAuthSMSProviders {
  TWILIO = "Twilio",
  MESSAGEBIRD = "MessageBird",
  VONAGE = "Vonage",
}
export type PhoneAuthSMSProviderParams =
  | "accountSID"
  | "authToken"
  | "fromNumberOrSID"
  | "accessKey"
  | "originator"
  | "apiKey"
  | "apiSecret"
  | "from";

export type OAuthProviderParams =
  | "key"
  | "secret"
  | "teamId"
  | "serviceId"
  | "keyId"
  | "privateKey";

export enum OAuthProviderTypes {
  Google = "google",
  Facebook = "facebook",
  Github = "github",
  Apple = "apple",
  Twitter = "twitter",
  Discord = "discord",
}

export interface OAuthProvider {
  provider: OAuthProviderTypes;
  params: {
    name: OAuthProviderParams;
    title: string;
    type: string;
    multiline: boolean;
  }[];
}
export interface Types {
  orgRoles: string[];
  appRoles: string[];
  bvlTypes: string[];
  fieldTypes: FieldType[];
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
  phoneAuthSMSProviders: {
    provider: PhoneAuthSMSProviders;
    params: {
      name: PhoneAuthSMSProviderParams;
      title: string;
      type: string;
      description: string;
      multiline: boolean;
    }[];
  }[];
  oAuthProviderTypes: OAuthProvider[];
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
export type GetModulesRequest = BaseGetRequest &
  BaseParams & {
    workspace?: boolean;
  };

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
export interface InvitationRequest extends BaseRequest {
  token?: string;
  tokens?: string[];
  appId?: string;
  orgId?: string;
  projectId?: string;
}
export interface UpdateRoleRequest extends BaseRequest {
  token?: string;
  userId?: string;
  role: string;
  appId?: string;
  orgId?: string;
  projectId?: string;
}
export interface RemoveMemberRequest extends BaseRequest {
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
  | "org.app"
  | "org.resource"
  | "app"
  | "resource"
  | "queue"
  | "org.app.version.queue"
  | "task"
  | "org.app.version.task"
  | "endpoint"
  | "org.app.version.endpoint"
  | "org.app.version.environment";

export interface BaseParams {
  orgId: string;
  appId: string;
  versionId: string;
}
export interface RealtimeIdentifiers {
  orgId?: string;
  appId?: string;
  userId?: string;
  versionId?: string;
  resourceId?: string;
  envId?: string;
  queueId?: string;
  environmentId?: string;
  endpointId?: string;
  taskId?: string;
  dbId?: string;
  modelId?: string;
  fieldId?: string;
  storageId?: string;
  cacheId?: string;
  middlewareId?: string;
  functionId?: string;
  bucketId?: string;
  bucketName?: string;
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

export interface Middleware {
  orgId: string;
  appId: string;
  versionId: string;
  iid: string;
  name: string;
  type: string;
  logic: string;
  createdBy: string;
  updatedBy?: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Step {
  text: string;
  path: string;
  isDone: boolean;
  prevPath?: string;
  nextPath?: string;
}
export interface SearchNPMPackages {
  package: string;
  version: string;
  description: string;
}

export type ColumnDefWithClassName<TData> = ColumnDef<TData> & {
  className?: string;
};

export type DatabaseType = {
  PostgreSQL: boolean;
  MySQL: boolean;
  "SQL Server": boolean;
  MongoDB: boolean;
  Oracle: boolean;
};

export interface FieldType extends DatabaseType {
  name: string;
  group: string;
  view: {
    unique: boolean;
    indexed: boolean;
    immutable: boolean;
    searchable: boolean;
  };
}

export type LogTypes = "info" | "log" | "debug" | "error" | "warn";
export interface Log {
  message: string;
  timestamp: string;
  pod?: string;
  type: LogTypes | EnvironmentStatus;
}

export const SMTPSchema = z.object({
  fromEmail: z.string({ required_error: "Email is required" }).email(),
  fromName: z.string().optional(),
  host: z
    .string({ required_error: "Host is required" })
    .trim()
    .refine((value) => value.trim().length > 0, "Host is required"),
  port: z.coerce
    .number({
      required_error: "Port is required",
    })
    .int()
    .positive()
    .min(100, "Port must be at least 3 characters long"),
  user: z
    .string({ required_error: "Username is required" })
    .trim()
    .refine((value) => value.trim().length > 0, "Username is required"),
  password: z.string({ required_error: "Password is required" }),
  useTLS: z.boolean().default(false),
});

export type SetupCluster = OnboardingData & BaseRequest;

declare global {
  // eslint-disable-next-line no-var
  var monaco: typeof import("monaco-editor");
  // eslint-disable-next-line no-var
  var ts: typeof import("typescript");
  // eslint-disable-next-line no-var
  var editor: import("monaco-editor").editor.IStandaloneCodeEditor;
  // eslint-disable-next-line no-var
  var controller: AbortController;
}

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
