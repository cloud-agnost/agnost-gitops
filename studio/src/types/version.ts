import { translate } from "@/utils";
import { z } from "zod";
import { ColumnFilterType, HttpMethod } from ".";
import { NameSchema } from "./schema";
import {
  BaseGetRequest,
  BaseParams,
  BaseRequest,
  OAuthProviderTypes,
  PhoneAuthSMSProviders,
  User,
} from "./type";
export interface APIKey {
  expiryDate?: string;
  updatedBy?: string;
  name: string;
  key: string;
  allowRealtime: true;
  type: APIKeyTypes;
  allowedEndpoints: string[];
  excludedEndpoints: string[];
  domainAuthorization: AllAndSpecified;
  authorizedDomains: string[];
  IPAuthorization: AllAndSpecified;
  authorizedIPs: string[];
  createdBy: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
}
export type APIKeyTypes =
  | "no-access"
  | "full-access"
  | "custom-allowed"
  | "custom-excluded";
export type AllAndSpecified = "all" | "specified";
export type VersionLogTypes = "endpoint" | "queue" | "task";
export interface VersionLog {
  _id: string;
  timestamp: string;
  name: string;
  status: "success" | "error";
  duration: number;
  orgId: string;
  appId: string;
  versionId: string;
  envId: string;
  queueId?: string;
  taskId?: string;
  epId?: string;
  message: any;
  errors: any;
  responseBody: object;
  method: HttpMethod;
  path: string;
  debug: boolean;
}

export interface GetVersionLogsParams extends BaseGetRequest, BaseParams {
  type: VersionLogTypes;
  filter: ColumnFilterType;
}
export interface VersionLogBucket {
  totalHits: number;
  buckets: {
    bucket: number;
    start: string;
    end: string;
    success: number;
    error: number;
  }[];
}

export interface GetVersionLogBucketsParams extends BaseParams {
  buckets: number;
  type: VersionLogTypes;
  start: string;
  end: string;
  filter: ColumnFilterType;
}

export interface RateLimit {
  _id: string;
  iid: string;
  createdBy: string | User;
  updatedBy: string | User;
  createdAt: string;
  updatedAt: string;
  name: string;
  rate: number;
  duration: number;
  errorMessage: string;
}

export interface Version {
  orgId: string;
  appId: string;
  iid: string;
  name: string;
  private: boolean;
  readOnly: boolean;
  master: boolean;
  realtime: VersionRealtimeProperties;
  defaultEndpointLimits: string[];
  authentication: VersionAuthentication;
  createdBy: string;
  updatedBy: string;
  _id: string;
  params: Param[];
  limits: RateLimit[];
  apiKeys: APIKey[];
  npmPackages: NPMPackage[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}
export interface VersionOAuthProvider {
  provider: OAuthProviderTypes;
  config: {
    key: string;
    secret: string;
    teamId: string;
    serviceId: string;
    keyId: string;
    privateKey: string;
  };
  createdBy: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export enum TemplateTypes {
  ConfirmEmail = "confirm_email",
  ResetPassword = "reset_password",
  MagicLink = "magic_link",
  ConfirmEmailChange = "confirm_email_change",
  VerifySMSCode = "verify_sms_code",
}

export interface VersionMessageTemplate {
  type: TemplateTypes;
  subject: string;
  body: string;
  createdBy: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
}

interface VersionAuthentication {
  email: {
    enabled: boolean;
    confirmEmail: boolean;
    expiresIn: number;
    customSMTP: {
      useTLS: boolean;
      host: string;
      port: number;
      user: string;
      password: string;
    };
  };
  phone: {
    enabled: boolean;
    confirmPhone: boolean;
    allowCodeSignIn: boolean;
    smsProvider: PhoneAuthSMSProviders;
    expiresIn: number;
    providerConfig: {
      accountSID?: string;
      authToken?: string;
      fromNumberOrSID?: string;
      accessKey?: string;
      originator?: string;
      apiKey?: string;
      apiSecret?: string;
      from?: string;
    };
  };
  redirectURLs: string[];
  providers: VersionOAuthProvider[];
  messages: VersionMessageTemplate[];
  userDataModel: {
    database: string;
    model: string;
  };
}
export interface Param {
  name: string;
  value: string;
  createdBy: string;
  updatedBy?: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export interface NPMPackage {
  name: string;
  version: string;
  description: string;
  createdBy: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
}
export type NotificationActions =
  | "create"
  | "update"
  | "delete"
  | "deploy"
  | "redeploy";
export interface Notification {
  _id: string;
  object: string;
  orgId: string;
  appId: string;
  versionId: string;
  dbId?: string;
  modelId?: string;
  fieldId?: string;
  resourceId?: string;
  envId?: string;
  endpointId?: string;
  middlewareId?: string;
  queueId?: string;
  taskId?: string;
  storageId?: string;
  action: NotificationActions;
  actor: Partial<User>;
  description: string;
  data: any;
  createdAt: string;
  __v: number;
}

export interface GetVersionNotificationParams extends BaseGetRequest {
  orgId: string;
  appId: string;
  versionId: string;
  actor?: string[];
  action?: NotificationActions[];
}

export interface GetVersionRequest extends BaseGetRequest {
  name?: string;
  appId: string;
  orgId: string;
}

export enum TabTypes {
  Database = "Database",
  Storage = "Storage",
  Cache = "Cache",
  MessageQueue = "Queue",
  Task = "Task",
  Endpoint = "Endpoint",
  Middleware = "Middleware",
  Settings = "Settings",
  APIKeys = "API Keys",
  Authentication = "Authentication",
  CustomDomains = "Custom Domains",
  Environment = "Environment",
  EnvironmentVariables = "Environment Variables",
  NPMPackages = "NPM Packages",
  RateLimits = "Rate Limits",
  Realtime = "Realtime",
  Dashboard = "Dashboard",
  Notifications = "Notifications",
  Function = "Function",
  Model = "Model",
  Field = "Field",
  Bucket = "Bucket",
  File = "File",
  Navigator = "Navigator",
  Container = "Container",
}

export type DesignElementTypes = Lowercase<TabTypes>;
export interface Tab {
  id: string;
  title: string;
  path: string;
  isActive: boolean;
  isDashboard: boolean;
  isDirty?: boolean;
  type: TabTypes;
}

export interface DesignElement {
  _id: string;
  versionId: string;
  name: string;
  type: DesignElementTypes;
  modelId?: string;
  meta: {
    method?: HttpMethod;
    modelName?: string;
    dbId?: string;
  };
}

export interface VersionParams extends BaseParams {
  envId: string;
}

export type GetVersionByIdParams = BaseParams;
export type DeleteVersionParams = BaseParams & BaseRequest;
export type CreateRateLimitParams = BaseParams & {
  rate: number;
  duration: number;
  name: string;
  errorMessage: string;
};
export type DeleteRateLimitParams = BaseParams &
  BaseRequest & {
    limitId: string;
  };

export type DeleteMultipleRateLimitsParams = BaseParams & {
  limitIds: string[];
};

export type VersionProperties = {
  name: string;
  private: boolean;
  readOnly: boolean;
  defaultEndpointLimits: string[];
};

export type VersionRealtimeProperties = {
  enabled: boolean;
  apiKeyRequired: boolean;
  sessionRequired: boolean;
  rateLimits: string[];
};

export type UpdateVersionRealtimePropertiesParams = BaseParams &
  VersionRealtimeProperties;

export type SearchNPMPackagesParams = BaseParams & {
  page: number;
  size: number;
  package: string;
  sortBy?: string;
};

export type AddNPMPackageParams = BaseParams & {
  name: string;
  version: string;
  description: string;
};

export type DeleteNPMPackageParams = BaseParams & {
  packageId: string;
};

export type DeleteMultipleNPMPackagesParams = BaseParams & {
  packageIds: string[];
};

export type DeleteVersionVariableParams = BaseParams & {
  paramId: string;
};

export type DeleteMultipleVersionVariablesParams = BaseParams & {
  paramIds: string[];
};

export type AddVersionVariableParams = BaseParams & {
  name: string;
  value: string;
};

export type UpdateVersionVariableParams = AddVersionVariableParams & {
  paramId: string;
};

export type CreateCopyOfVersionParams = Omit<BaseParams, "versionId"> &
  BaseRequest & {
    name: string;
    private: boolean;
    readOnly: boolean;
    parentVersionId: string;
  };

export type EditRateLimitParams = CreateRateLimitParams & {
  limitId: string;
};

export type CreateAPIKeyParams = BaseParams & {
  name: string;
  allowRealtime: boolean;
  type: APIKeyTypes;
  domainAuthorization: AllAndSpecified;
  IPAuthorization: AllAndSpecified;
  expiryDate?: Date;
  excludedEndpoints?: string[];
  allowedEndpoints?: string[];
  authorizedDomains?: string[];
  authorizedIPs?: string[];
};

export type UpdateAPIKeyParams = BaseParams &
  CreateAPIKeyParams & {
    keyId: string;
  };
export type DeleteAPIKeyParams = BaseParams & {
  keyId: string;
};
export type DeleteMultipleAPIKeys = BaseParams & {
  keyIds: string[];
};
export type SearchDesignElementParams = BaseParams & {
  keyword: string;
};
export type SaveUserDataModelInfoParams = BaseParams &
  BaseRequest & {
    modelId: string;
    databaseId: string;
  };
export type SaveRedirectURLsParams = BaseParams &
  BaseRequest & {
    redirectURLs: string[];
  };

export interface SaveEmailAuthParams extends BaseParams, BaseRequest {
  enabled: boolean;
  confirmEmail: boolean;
  expiresIn: number;
  customSMTP: {
    host: string;
    port: number;
    useTLS: boolean;
    user: string;
    password: string;
  };
}
export interface SaveEmailPhoneParams extends BaseParams, BaseRequest {
  enabled: boolean;
  confirmPhone: boolean;
  allowCodeSignIn: boolean;
  expiresIn: number;
  smsProvider: "Twilio" | "Vonage" | "MessageBird";
  providerConfig: {
    accountSID?: string;
    authToken?: string;
    fromNumberOrSID?: string;
    accessKey?: string;
    originator?: string;
    apiKey?: string;
    apiSecret?: string;
    from?: string;
  };
}
export interface CreateOAuthConfigParams extends BaseParams, BaseRequest {
  provider: OAuthProviderTypes;
  config: {
    key?: string;
    secret?: string;
    teamId?: string;
    serviceId?: string;
    keyId?: string;
    privateKey?: string;
  };
}
export interface UpdateOAuthConfigParams extends BaseParams, BaseRequest {
  providerId: string;
  key: string;
  secret: string;
}
export interface DeleteOAuthConfigParams extends BaseParams, BaseRequest {
  providerId: string;
}
export interface AuthMessageTemplateParams extends BaseParams, BaseRequest {
  type: string;
  body: string;
}

export type UpdateVersionPropertiesParams = BaseParams &
  Partial<Version> &
  BaseRequest;
export type UpdateTabParams = {
  versionId: string;
  tab: Partial<Tab>;
  filter(tab: Tab): boolean;
};
export interface Dashboard {
  database: number;
  cache: number;
  storage: number;
  endpoint: number;
  middleware: number;
  function: number;
  queue: number;
  task: number;
}

export const EnvVariableSchema = z.object({
  name: NameSchema,
  value: z.any({
    required_error: translate("forms.required", {
      label: translate("general.value"),
    }),
  }),
});

export type AddCustomDomainParams = BaseParams & {
  domain: string;
};

export type DeleteCustomDomainParams = BaseParams & {
  domainId: string;
};

export type DeleteMultipleCustomDomainsParams = BaseParams & {
  domainIds: string[];
};

export type GetCustomDomainParams = VersionParams & BaseGetRequest;

export interface CustomDomain {
  _id: string;
  orgId: string;
  appId: string;
  versionId: string;
  iid: string;
  domain: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchCodeParams extends BaseGetRequest, BaseParams {
  find: string;
  matchCase: boolean;
  matchWholeWord: boolean;
}

export interface SearchCodeResult {
  _id: string;
  versionId: string;
  name: string;
  type: DesignElementTypes;
  meta: {
    method?: HttpMethod;
    path?: string;
  };
  matchingLines: {
    lineNumber: number;
    lineText: string;
  }[];
}

export interface PushVersionParams extends BaseParams {
  targetVersionId: string;
  redeploy: boolean;
}
