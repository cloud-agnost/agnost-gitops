import Tools from "@/assets/images/complete_set_of_tools.webp";
import CronJobs from "@/assets/images/cron_jobs.webp";
import Database from "@/assets/images/database.png";
import FasterDevelopment from "@/assets/images/faster_development.webp";
import Queue from "@/assets/images/message_queues.webp";
import RealtimeCollaboration from "@/assets/images/realtime_collaboration.webp";
import Security from "@/assets/images/security.webp";
import Serverless from "@/assets/images/serverless_functions.webp";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

import {
  Apple,
  Awss3,
  AzureBlobStorage,
  Binary,
  Decimal,
  Decision,
  Discord,
  Facebook,
  GcpStorage,
  Github,
  Google,
  Integer,
  Kafka,
  MinIo,
  MongoDb,
  MySql,
  Nodejs,
  Object as ObjectIcon,
  ObjectList,
  Oracle,
  PostgreSql,
  RabbitMq,
  React,
  Redis,
  Resource,
  RichText,
  SocketIo,
  SqlServer,
  Timestamp,
  Twitter,
} from "@/components/icons";
import AppIcon from "@/features/organization/navbar/AppIcon";
import {
  ConnectAWS,
  ConnectAzure,
  ConnectCache,
  ConnectDatabase,
  ConnectGCP,
  ConnectQueue,
} from "@/features/resources";
import useApplicationStore from "@/store/app/applicationStore";
import useAuthStore from "@/store/auth/authStore";
import useProjectStore from "@/store/project/projectStore";
import {
  AppRoles,
  Application,
  DatabaseTypes,
  EnvironmentStatus,
  HttpMethod,
  Instance,
  OAuthProviderTypes,
  ResourceCreateType,
  ResourceInstances,
  ResourceType,
  SortOption,
  Tab,
  TabTypes,
} from "@/types";
import { Project } from "@/types/project";
import { getAppPermission, getProjectPermission, translate } from "@/utils";
import {
  ArchiveBox,
  Bell,
  BracketsCurly,
  Calendar,
  Clock,
  ClockCounterClockwise,
  ComputerTower,
  CurrencyDollarSimple,
  Database as DatabaseIcon,
  EjectSimple,
  Envelope,
  FileText,
  Function,
  Gauge,
  GearSix,
  GitBranch,
  GlobeSimple,
  HardDrive,
  HardDrives,
  IdentificationBadge,
  Key,
  Lightning,
  LineSegments,
  LinkSimple,
  ListChecks,
  ListNumbers,
  LockSimple,
  MapPin,
  PencilSimple,
  Phone,
  Plus,
  PresentationChart,
  ProjectorScreenChart,
  Share,
  ShareNetwork,
  ShippingContainer,
  SignOut,
  Signpost,
  SkipForward,
  Table,
  TextAa,
  Textbox,
  Timer,
  Toolbox,
  Trash,
  UserPlus,
  Users,
  Vault,
} from "@phosphor-icons/react";
import { BadgeColors } from "components/Badge/Badge.tsx";
import { ElementType } from "react";

export const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;
export const BASE_URL_WITH_API = `${BASE_URL}/api`;
export const PAGE_SIZE = 10;
export const MODULE_PAGE_SIZE = 250;
export const UI_BASE_URL = window.location.origin;
export const MIN_DB_SIZE = 1;
export const MAX_DB_SIZE = 50;

export const SLIDER_IMAGES = [
  {
    key: "faster",
    image: FasterDevelopment,
  },
  {
    key: "tools",
    image: Tools,
  },
  {
    key: "database",
    image: Database,
  },
  {
    key: "serverless",
    image: Serverless,
  },
  {
    key: "queue",
    image: Queue,
  },
  {
    key: "cron",
    image: CronJobs,
  },
  {
    key: "realtime",
    image: RealtimeCollaboration,
  },
  {
    key: "security",
    image: Security,
  },
];

export const MENU_ITEMS = [
  {
    title: "Change Log",
    url: "https://github.com/cloud-agnost/agnost-community/releases",
    icon: ClockCounterClockwise,
  },
  {
    title: "Docs",
    url: "https://agnost.dev/docs/intro",
    icon: FileText,
  },
];

export const MENU_ITEMS_FOR_PROFILE_SETTINGS = [
  {
    title: translate("profileSettings.general_title"),
    href: "/profile",
    icon: GearSix,
  },
  {
    title: translate("profileSettings.notifications_title"),
    href: "/profile/notifications",
    icon: Bell,
  },
  {
    title: translate("profileSettings.clusters_title"),
    href: "/profile/cluster-management",
    icon: LineSegments,
  },
];

export const ORGANIZATION_MENU_ITEMS = [
  {
    name: translate("organization.menu.projects"),
    href: "projects",
    icon: ProjectorScreenChart,
  },
  {
    name: translate("organization.menu.apps"),
    href: "apps",
    icon: AppIcon,
  },
  {
    name: translate("organization.menu.resources"),
    href: "resources",
    icon: Resource,
  },
  {
    name: translate("organization.menu.settings"),
    href: "settings",
    icon: GearSix,
  },
];

export const APPLICATION_SETTINGS = [
  {
    id: "version",
    name: translate("application.settings.openVersion"),
    onClick: (application: Application) => {
      useApplicationStore.getState().onAppClick(application);
    },
    isDisabled: (role: AppRoles) => !getAppPermission("version.view", role),
    icon: GitBranch,
  },
  {
    id: "update",
    name: translate("application.settings.editApp"),
    onClick: (application: Application) => {
      useApplicationStore.getState().openEditAppDrawer(application);
      const searchParams = new URLSearchParams(window.location.search);
      if (!searchParams.get("t")) {
        searchParams.set("t", "general");
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}?${searchParams.toString()}`
        );
      }
    },
    isDisabled: (role: AppRoles) => !getAppPermission("update", role),
    icon: PencilSimple,
  },
  {
    id: "invite",
    name: translate("general.addMembers"),
    onClick: (application: Application) => {
      useApplicationStore.getState().openInviteMemberDrawer(application);
    },
    isDisabled: (role: AppRoles) => !getAppPermission("invite.create", role),
    icon: UserPlus,
  },
  {
    id: "leave-app",
    name: translate("application.settings.leaveTeam"),
    onClick: (application: Application) => {
      useApplicationStore.getState().openLeaveModal(application);
    },
    isDisabled: (_role: AppRoles, application: Application) => {
      return useAuthStore.getState().user?._id === application.ownerUserId;
    },
    icon: SignOut,
  },
  {
    id: "delete-app",
    name: translate("general.delete"),
    onClick: (application: Application) => {
      useApplicationStore.getState().openDeleteModal(application);
    },
    isDisabled: (role: AppRoles) => !getAppPermission("delete", role),
    icon: Trash,
  },
];
export const PROJECT_SETTINGS = [
  {
    id: "environment",
    name: translate("project.settings.openEnv"),
    onClick: (project: Project) => {
      useProjectStore.getState().onProjectClick(project);
    },
    isDisabled: (role: AppRoles) => !getProjectPermission("version.view", role),
    icon: GitBranch,
  },
  {
    id: "update",
    name: translate("project.settings.editProject"),
    onClick: (project: Project) => {
      useProjectStore.getState().openEditProjectDrawer(project);
      const searchParams = new URLSearchParams(window.location.search);
      if (!searchParams.get("t")) {
        searchParams.set("t", "general");
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}?${searchParams.toString()}`
        );
      }
    },
    isDisabled: (role: AppRoles) => !getProjectPermission("update", role),
    icon: PencilSimple,
  },
  {
    id: "invite",
    name: translate("general.addMembers"),
    onClick: (project: Project) => {
      useProjectStore.getState().openInviteMemberModal(project);
    },
    isDisabled: (role: AppRoles) =>
      !getProjectPermission("invite.create", role),
    icon: UserPlus,
  },
  {
    id: "leave-app",
    name: translate("project.settings.leaveTeam"),
    onClick: (project: Project) => {
      useProjectStore.getState().openLeaveModal(project);
    },
    isDisabled: (_role: AppRoles, project: Project) => {
      return useAuthStore.getState().user?._id === project.ownerUserId;
    },
    icon: SignOut,
  },
  {
    id: "delete-app",
    name: translate("general.delete"),
    onClick: (project: Project) => {
      useProjectStore.getState().openDeleteModal(project);
    },
    isDisabled: (role: AppRoles) => !getProjectPermission("delete", role),
    icon: Trash,
  },
];

export const ORGANIZATION_SETTINGS = [
  {
    title: translate("organization.settings.general"),
    href: "/organization/:id/settings",
    icon: GearSix,
  },
  {
    title: translate("organization.settings.members.title"),
    href: "/organization/:id/settings/members",
    icon: Users,
  },
];

export const ALL_NOTIFICATIONS = [
  "org",
  "app",
  "version",
  "database",
  "model",
  "field",
  "endpoint",
  "queue",
  "task",
  "cache",
  "storage",
  "resource",
  "environment",
  "middleware",
  "function",
];

export const ERROR_CODES_TO_REDIRECT_LOGIN_PAGE = [
  "invalid_user",
  "invalid_session",
  "missing_access_token",
  "invalid_access_token",
  "missing_refresh_token",
  "invalid_refresh_token",
];

export const ORG_MEMBERS_SORT_OPTIONS: SortOption[] = [
  {
    name: translate("general.sortOptions.default"),
    value: "default",
  },
  {
    name: translate("general.sortOptions.joinDate"),
    value: "joinDate",
    sortDir: "desc",
  },
  {
    name: translate("general.sortOptions.nameAsc"),
    value: "name",
    sortDir: "asc",
  },
  {
    name: translate("general.sortOptions.nameDesc"),
    value: "name",
    sortDir: "desc",
  },
];

export const INVITATIONS_SORT_OPTIONS: SortOption[] = [
  {
    name: translate("general.sortOptions.inviteDate"),
    value: "createdAt",
    sortDir: "desc",
  },
  {
    name: translate("general.sortOptions.emailAsc"),
    value: "email",
    sortDir: "asc",
  },
  {
    name: translate("general.sortOptions.emailDesc"),
    value: "email",
    sortDir: "desc",
  },
];
export const NEW_TAB_ITEMS: Omit<Tab, "id">[] = [
  {
    title: translate("version.databases"),
    path: "database",
    isActive: false,
    isDashboard: false,
    type: TabTypes.Database,
  },
  {
    title: translate("version.storage"),
    path: "/storage",
    isActive: false,
    isDashboard: false,
    type: TabTypes.Storage,
  },
  {
    title: translate("version.cache"),
    path: "/cache",
    isActive: false,
    isDashboard: false,
    type: TabTypes.Cache,
  },
  {
    title: translate("version.endpoints"),
    path: "/endpoint",
    isActive: false,
    isDashboard: false,
    type: TabTypes.Endpoint,
  },
  {
    title: translate("version.message_queues"),
    path: "/queue",
    isActive: false,
    isDashboard: false,
    type: TabTypes.MessageQueue,
  },
  {
    title: translate("version.cron_jobs"),
    path: "/task",
    isActive: false,
    isDashboard: false,
    type: TabTypes.Task,
  },
  {
    title: translate("version.middleware.default"),
    path: "/middleware",
    isActive: false,
    isDashboard: false,
    type: TabTypes.Middleware,
  },
  {
    title: translate("version.function"),
    path: "/function",
    isActive: false,
    isDashboard: false,
    type: TabTypes.Function,
  },
];

export const BADGE_COLOR_MAP: Record<string, BadgeColors> = {
  SUSPENDED: "orange",
  DEPLOYING: "orange",
  ERROR: "red",
  OK: "green",
  GOOD: "green",
  YES: "green",
  NO: "red",
  ADMIN: "orange",
  DEVELOPER: "purple",
  VIEWER: "blue",
  "RESOURCE MANAGER": "green",
  MEMBER: "yellow",
  CREATING: "blue",
  UPDATING: "yellow",
  RESTARTING: "orange",
  DELETING: "red",
  BINDING: "blue",
  OPTIONAL: "yellow",
  REQUIRED: "blue",
  ENABLED: "green",
  DISABLED: "red",
  SUCCESS: "green",
  SUCCESSFUL: "green",
  LOG: "green",
  INFO: "blue",
  WARN: "yellow",
  DEBUG: "purple",
  IDLE: "orange",
  TRUE: "green",
  FALSE: "red",
  RUNNING: "green",
  FAILED: "red",
  WARNING: "yellow",
  INITIALIZED: "green",
  PODSCHEDULED: "yellow",
  CONTAINERSREADY: "blue",
  READY: "orange",
  PENDING: "yellow",
  SUCCEEDED: "green",
  CONNECTED: "blue",
  STARTED: "blue",
};

export const EDIT_APPLICATION_MENU_ITEMS = [
  {
    name: translate("application.edit.general"),
    href: "general",
  },
  {
    name: translate("application.edit.members"),
    href: "members",
  },
  {
    name: translate("application.edit.invitations"),
    href: "invitations",
  },
];

export const AUTH_MENU_ITEMS = [
  {
    name: translate("version.settings.general"),
    href: "general",
  },
  {
    name: translate("version.authentication.providers"),
    href: "providers",
  },
  {
    name: translate("version.authentication.message_templates"),
    href: "templates",
  },
];

export const TEST_ENDPOINTS_MENU_ITEMS = [
  {
    name: translate("endpoint.test.params"),
    href: "params",
    isPath: false,
    allowedMethods: ["GET", "DELETE", "PUT", "POST"],
  },
  {
    name: translate("endpoint.test.path_variables"),
    href: "variables",
    isPath: true,
    allowedMethods: ["GET", "DELETE", "PUT", "POST"],
  },
  {
    name: translate("endpoint.test.headers"),
    href: "headers",
    isPath: false,
    allowedMethods: ["GET", "DELETE", "PUT", "POST"],
  },
  {
    name: translate("endpoint.test.body"),
    href: "body",
    isPath: false,
    allowedMethods: ["DELETE", "PUT", "POST"],
  },
];

export const VERSION_SETTINGS_MENU_ITEMS = [
  {
    id: 1,
    title: translate("version.settings.general"),
    href: "",
    type: TabTypes.Settings,
    icon: GearSix,
  },
  {
    id: 8,
    title: translate("version.settings.api_keys"),
    href: "api-keys",
    type: TabTypes.APIKeys,
    icon: Key,
  },
  {
    id: 7,
    title: translate("version.settings.authentications"),
    href: "authentications?t=general",
    type: TabTypes.Authentication,
    icon: IdentificationBadge,
  },
  {
    id: 9,
    title: translate("cluster.custom_domain"),
    href: "custom-domain",
    type: TabTypes.CustomDomains,
    icon: GlobeSimple,
  },
  {
    id: 2,
    title: translate("version.settings.environment"),
    href: "environment",
    type: TabTypes.Environment,
    icon: ComputerTower,
  },
  {
    id: 5,
    title: translate("version.settings.environment_variables"),
    href: "environment-variables",
    type: TabTypes.EnvironmentVariables,
    icon: Vault,
  },
  {
    id: 4,
    title: translate("version.settings.npm_packages"),
    href: "npm-packages",
    type: TabTypes.NPMPackages,
    icon: ArchiveBox,
  },
  {
    id: 6,
    title: translate("version.settings.rate_limits"),
    href: "rate-limits",
    type: TabTypes.RateLimits,
    icon: Gauge,
  },

  {
    id: 10,
    title: translate("version.settings.real_time"),
    href: "real-time",
    type: TabTypes.Realtime,
    icon: ShareNetwork,
  },
];

export const RESOURCE_TYPES = [
  {
    id: "database",
    name: translate("version.databases"),
    icon: Resource,
  },
  {
    id: "storage",
    name: translate("version.storage"),
    icon: Storage,
  },
  {
    id: "cache",
    name: translate("version.cache"),
    icon: HardDrive,
  },
  {
    id: "message-queue",
    name: translate("version.message_queues"),
    icon: Envelope,
  },
];

export const DEFAULT_RESOURCE_INSTANCES: Instance[] = [
  {
    id: ResourceCreateType.New,
    name: translate("resources.create_new"),
    icon: Plus,
  },
  {
    id: ResourceCreateType.Existing,
    name: translate("resources.connect_existing"),
    icon: EjectSimple,
  },
];

export const CREATE_RESOURCE_TYPES = ["database", "cache", "storage", "queue"];

export const DATABASE_ICON_MAP: Record<DatabaseTypes, ElementType> = {
  MongoDB: MongoDb,
  MySQL: MySql,
  PostgreSQL: PostgreSql,
  // Oracle: Oracle,
  // 'SQL Server': SqlServer,
};
export const QUEUE_ICON_MAP: Record<string, ElementType> = {
  RabbitMQ: RabbitMq,
  Kafka: Kafka,
};

export const STORAGE_ICON_MAP: Record<string, ElementType> = {
  "AWS S3": Awss3,
  "Azure Blob Storage": AzureBlobStorage,
  "GCP Cloud Storage": GcpStorage,
  MinIO: MinIo,
};

export const CREATE_RESOURCES_ELEMENTS = [
  {
    name: translate("version.databases"),
    resourceType: ResourceType.Database,
    instance: ResourceType.Database,
    CurrentResourceElement: ConnectDatabase,
  },
  {
    name: translate("version.storage"),
    resourceType: ResourceType.Storage,
    instance: ResourceInstances.GCPStorage,
    CurrentResourceElement: ConnectGCP,
  },
  {
    name: translate("version.storage"),
    resourceType: ResourceType.Storage,
    instance: ResourceInstances.AWSS3,
    CurrentResourceElement: ConnectAWS,
  },
  {
    name: translate("version.storage"),
    resourceType: ResourceType.Storage,
    instance: ResourceInstances.AzureBlob,
    CurrentResourceElement: ConnectAzure,
  },
  {
    name: translate("version.cache"),
    resourceType: ResourceType.Cache,
    instance: ResourceInstances.Redis,
    CurrentResourceElement: ConnectCache,
  },
  {
    name: translate("version.message_queues"),
    resourceType: ResourceType.Queue,
    instance: ResourceInstances.RabbitMQ,
    CurrentResourceElement: ConnectQueue,
  },
];

/**
 * @type APIKeyTypes
 */
export const ENDPOINT_ACCESS_PROPERTIES = [
  "no-access",
  "full-access",
  "custom-allowed",
  "custom-excluded",
] as const;

/**
 * @type AllAndSpecified
 */
export const AUTHORIZATION_OPTIONS = ["all", "specified"] as const;

export const RABBITMQ_CONNECTION_TYPES = ["url", "object"] as const;
export const RABBITMQ_CONNECTION_SCHEMES = ["amqp", "amqps"] as const;
export const KAFKA_CONNECTION_SCHEMES = ["simple", "ssl", "sasl"] as const;
export const KAFKA_SASL_MECHANISM = [
  "plain",
  "scram-sha-256",
  "scram-sha-512",
] as const;
export const MONGODB_CONNECTION_FORMATS = ["mongodb+srv", "mongodb"] as const;
export const ADD_API_KEYS_MENU_ITEMS = [
  {
    name: translate("application.edit.general"),
    href: "general",
  },
  {
    name: translate("version.api_key.allowed_domains"),
    href: "allowed-domains",
  },
  {
    name: translate("version.api_key.allowed_ips"),
    href: "allowed-ips",
  },
];

export const EDIT_CONTAINER_TABS = [
  {
    href: "settings",
    name: translate("general.settings"),
  },
  {
    href: "variables",
    name: translate("container.variables"),
  },
  {
    href: "builds",
    name: translate("container.builds"),
  },
  {
    href: "pods",
    name: translate("container.pods"),
  },
  {
    href: "logs",
    name: translate("container.logs"),
  },
  {
    href: "events",
    name: translate("container.events"),
  },
];
export const ADD_RESOURCE_TABS = [
  {
    href: "settings",
    name: translate("general.settings"),
  },
  {
    href: "networking",
    name: translate("resources.networking"),
  },
];

export const ENDPOINT_OPTIONS: SortOption[] = [
  {
    name: translate("general.sortOptions.default"),
    value: "createdAt",
    sortDir: "desc",
  },
  {
    name: translate("general.sortOptions.nameAsc"),
    value: "name",
    sortDir: "asc",
  },
  {
    name: translate("general.sortOptions.nameDesc"),
    value: "name",
    sortDir: "desc",
  },
];

export const ALL_HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "DELETE"];

export const HTTP_METHOD_BADGE_MAP: Record<string, BadgeColors> = {
  GET: "blue",
  POST: "green",
  PUT: "yellow",
  DELETE: "red",
};
export const INSTANCE_PORT_MAP: Record<string, number> = {
  PostgreSQL: 5432,
  MySQL: 3306,
  "SQL Server": 1433,
  MongoDB: 27017,
  Oracle: 1521,
  Redis: 6379,
  RabbitMQ: 5672,
};

export const ENDPOINT_METHOD_BG_COLOR: Record<string, string> = {
  GET: "!bg-elements-subtle-blue dark:!bg-elements-strong-blue",
  POST: "!bg-elements-subtle-green dark:!bg-elements-strong-green",
  PUT: "!bg-elements-subtle-yellow dark:!bg-elements-strong-yellow",
  DELETE: "!bg-elements-subtle-red dark:!bg-elements-strong-red",
};
export const ENDPOINT_METHOD_TEXT_COLOR: Record<string, string> = {
  GET: "dark:!text-elements-subtle-blue !text-elements-strong-blue",
  POST: "dark:!text-elements-subtle-green !text-elements-strong-green",
  PUT: "dark:!text-elements-subtle-yellow !text-elements-strong-yellow",
  DELETE: "dark:!text-elements-subtle-red !text-elements-strong-red",
};

export const ENDPOINT_RESPONSE_TABS = [
  {
    id: "body",
    name: translate("endpoint.test.body"),
  },
  {
    id: "cookies",
    name: translate("endpoint.test.cookies"),
  },
  {
    id: "headers",
    name: translate("endpoint.test.headers"),
  },
  {
    id: "console",
    name: translate("endpoint.test.console_logs"),
  },
];

export const FIELD_ICON_MAP: Record<string, ElementType> = {
  text: TextAa,
  email: Envelope,
  link: LinkSimple,
  "encrypted-text": LockSimple,
  phone: Phone,
  "rich-text": RichText,
  boolean: Decision,
  integer: Integer,
  decimal: Decimal,
  monetary: CurrencyDollarSimple,
  datetime: Timestamp,
  date: Calendar,
  time: Clock,
  enum: ListChecks,
  "geo-point": MapPin,
  binary: Binary,
  json: BracketsCurly,
  reference: Share,
  "basic-values-list": ListNumbers,
  object: ObjectIcon,
  "object-list": ObjectList,
  id: IdentificationBadge,
};

/**
 * @type ReferenceAction
 */
export const REFERENCE_FIELD_ACTION = [
  "CASCADE",
  "NO ACTION",
  "SET NULL",
  "SET DEFAULT",
] as const;

export const MAX_LENGTHS: Record<string, number | Record<string, number>> = {
  "encrypted-text": 50,
  decimal: 10,
  enum: 2048,
  text: {
    MySQL: 16_382,
    "SQL Server": 4_000,
    PostgreSQL: 10_485_760,
    Oracle: 4_000,
    MongoDB: Number.MAX_SAFE_INTEGER,
  },
};

export const DATABASE = {
  MySQL: "MySQL",
  SQLServer: "SQL Server",
  PostgreSQL: "PostgreSQL",
  Oracle: "Oracle",
  MongoDB: "MongoDB",
};

export const TAB_ICON_MAP: Record<TabTypes, ElementType> = {
  [TabTypes.Storage]: HardDrives,
  [TabTypes.Database]: DatabaseIcon,
  [TabTypes.Cache]: Lightning,
  [TabTypes.Endpoint]: Signpost,
  [TabTypes.MessageQueue]: Envelope,
  [TabTypes.Task]: Timer,
  [TabTypes.Middleware]: SkipForward,
  [TabTypes.Settings]: GearSix,
  [TabTypes.Dashboard]: PresentationChart,
  [TabTypes.Notifications]: Bell,
  [TabTypes.Function]: Function,
  [TabTypes.Field]: Textbox,
  [TabTypes.Model]: Table,
  [TabTypes.Navigator]: Table,
  [TabTypes.Bucket]: Toolbox,
  [TabTypes.File]: FileText,
  [TabTypes.APIKeys]: Key,
  [TabTypes.Authentication]: IdentificationBadge,
  [TabTypes.CustomDomains]: GlobeSimple,
  [TabTypes.Environment]: ComputerTower,
  [TabTypes.EnvironmentVariables]: Vault,
  [TabTypes.NPMPackages]: ArchiveBox,
  [TabTypes.RateLimits]: Gauge,
  [TabTypes.Realtime]: ShareNetwork,
  [TabTypes.Container]: ShippingContainer,
};

export const ENV_STATUS_CLASS_MAP: Record<EnvironmentStatus, string[]> = {
  Deploying: ["bg-elements-subtle-orange", "bg-elements-orange"],
  Error: ["bg-elements-subtle-red", "bg-elements-red"],
  Idle: ["bg-elements-subtle-orange", "bg-elements-orange"],
  OK: ["bg-elements-subtle-green", "bg-elements-green"],
  Suspended: ["bg-elements-subtle-orange", "bg-elements-orange"],
  Redeploying: ["bg-elements-subtle-orange", "bg-elements-orange"],
  Deleting: ["bg-elements-subtle-red", "bg-elements-red"],
  [EnvironmentStatus.Updating]: [
    "bg-elements-subtle-orange",
    "bg-elements-orange",
  ],
};
export const CLUSTER_RELEASE_CLASS_MAP: Record<string, string[]> = {
  Error: ["bg-elements-subtle-red", "bg-elements-red"],
  OK: ["bg-elements-subtle-green", "bg-elements-green"],
  Updating: ["bg-elements-subtle-orange", "bg-elements-orange"],
  "Has update": ["bg-elements-subtle-blue", "bg-elements-blue"],
};

export const NOTIFICATION_ACTIONS = [
  "create",
  "update",
  "deploy",
  "redeploy",
  "delete",
];
export const OAUTH_ICON_MAP: Record<OAuthProviderTypes, ElementType> = {
  google: Google,
  github: Github,
  facebook: Facebook,
  twitter: Twitter,
  discord: Discord,
  apple: Apple,
};
export const OAUTH_URL_MAP: Record<OAuthProviderTypes, string> = {
  google: "https://console.developers.google.com/",
  github:
    "https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app",
  facebook: "https://developers.facebook.com/",
  twitter: "https://dev.twitter.com/",
  discord: "https://discord.com/developers/docs/topics/oauth2",
  apple: "https://developer.apple.com/",
};

export const RESOURCE_ICON_MAP: Record<string, ElementType> = {
  MongoDB: MongoDb,
  MySQL: MySql,
  PostgreSQL: PostgreSql,
  Oracle: Oracle,
  "SQL Server": SqlServer,
  RabbitMQ: RabbitMq,
  Kafka: Kafka,
  "AWS S3": Awss3,
  "Azure Blob Storage": AzureBlobStorage,
  "GCP Cloud Storage": GcpStorage,
  MinIO: MinIo,
  Redis,
  "API Server": Nodejs,
  Agenda: Nodejs,
  "Socket.io": SocketIo,
  "Node.js": Nodejs,
  React,
};

export const VERSION_CHANGE_EXCEPTIONS = [
  "organization",
  "app",
  "theme",
  "types",
  "tab",
  "cluster",
  "auth",
  "onBoarding",
  "resource",
];
export const ORG_CHANGE_EXCEPTIONS = [
  "organization",
  "theme",
  "types",
  "cluster",
  "auth",
  "onBoarding",
];

export const FORBIDDEN_EP_PREFIXES = ["/agnost"];

export const FORBIDDEN_RESOURCE_NAMES = [
  "mongodb",
  "rabbitmq-server",
  "redis-master",
  "redis",
  "redis-headless",
  "rabbitmq",
  "minio",
];

export const FIELD_MAPPER: Record<string, string> = {
  createdat: "datetime",
  updatedat: "datetime",
  parent: "reference",
};
export const SURROUND_MENU_ITEMS: monaco.editor.IActionDescriptor[] = [
  {
    id: "surround-with-try-catch",
    label: "Surround with Try-Catch",
    precondition: "editorHasSelection", // Action will only be shown when there's a selection
    run: (ed) => {
      const selection = ed.getSelection() as monaco.Selection;
      const selectedText = ed.getModel()?.getValueInRange(selection);

      const tryCatchBlock =
        `try {\n` + `  ${selectedText}\n` + `} catch (error) {\n` + `}`;

      ed.executeEdits("", [
        {
          range: new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          text: tryCatchBlock,
          forceMoveMarkers: true,
        },
      ]);
    },
  },
  {
    id: "surround-with-try-catch-finally",
    label: "Surround with Try-Catch-Finally",
    precondition: "editorHasSelection", // Action will only be shown when there's a selection
    run: (ed) => {
      const selection = ed.getSelection() as monaco.Selection;
      const selectedText = ed.getModel()?.getValueInRange(selection);

      const tryCatchFinallyBlock =
        `try {\n` +
        `  ${selectedText}\n` +
        `} catch (error) {\n` +
        `} finally {\n` +
        `}`;

      ed.executeEdits("", [
        {
          range: new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          text: tryCatchFinallyBlock,
          forceMoveMarkers: true,
        },
      ]);
    },
  },
  {
    id: "surround-with-if",
    label: "Surround with If",
    precondition: "editorHasSelection", // Action will only be shown when there's a selection
    run: (ed) => {
      const selection = ed.getSelection() as monaco.Selection;
      const selectedText = ed.getModel()?.getValueInRange(selection);

      const ifBlock = `if (condition) {\n` + `  ${selectedText}\n` + `}`;

      ed.executeEdits("", [
        {
          range: new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          text: ifBlock,
          forceMoveMarkers: true,
        },
      ]);
    },
  },
  {
    id: "surround-with-if-else",
    label: "Surround with If-Else",
    precondition: "editorHasSelection", // Action will only be shown when there's a selection
    run: (ed) => {
      const selection = ed.getSelection() as monaco.Selection;
      const selectedText = ed.getModel()?.getValueInRange(selection);

      const ifElseBlock =
        `if (condition) {\n` + `  ${selectedText}\n` + `} else {\n` + `}`;

      ed.executeEdits("", [
        {
          range: new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          text: ifElseBlock,
          forceMoveMarkers: true,
        },
      ]);
    },
  },
  {
    id: "surround-with-for-loop",
    label: "Surround with For Loop",
    precondition: "editorHasSelection",
    run: (ed) => {
      const selection = ed.getSelection() as monaco.Selection;
      const selectedText = ed.getModel()?.getValueInRange(selection);

      const forLoopBlock =
        `for (let i = 0; i < array.length; i++) {\n` +
        `  ${selectedText}\n` +
        `}`;

      ed.executeEdits("", [
        {
          range: new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          text: forLoopBlock,
          forceMoveMarkers: true,
        },
      ]);
    },
  },
  {
    id: "surround-with-for-in-loop",
    label: "Surround with For-In Loop",
    precondition: "editorHasSelection",
    run: (ed) => {
      const selection = ed.getSelection() as monaco.Selection;
      const selectedText = ed.getModel()?.getValueInRange(selection);

      const forInLoopBlock =
        `for (const key in object) {\n` + `  ${selectedText}\n` + `}`;

      ed.executeEdits("", [
        {
          range: new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          text: forInLoopBlock,
          forceMoveMarkers: true,
        },
      ]);
    },
  },
  {
    id: "surround-with-for-of-loop",
    label: "Surround with For-Of Loop",
    precondition: "editorHasSelection",
    run: (ed) => {
      const selection = ed.getSelection() as monaco.Selection;
      const selectedText = ed.getModel()?.getValueInRange(selection);

      const forOfLoopBlock =
        `for (const element of array) {\n` + `  ${selectedText}\n` + `}`;

      ed.executeEdits("", [
        {
          range: new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          text: forOfLoopBlock,
          forceMoveMarkers: true,
        },
      ]);
    },
  },
  {
    id: "surround-with-foreach-loop",
    label: "Surround with Foreach Loop",
    precondition: "editorHasSelection",
    run: (ed) => {
      const selection = ed.getSelection() as monaco.Selection;
      const selectedText = ed.getModel()?.getValueInRange(selection);

      const foreachLoopBlock =
        `array.forEach((element) => {\n` + `  ${selectedText}\n` + `});`;

      ed.executeEdits("", [
        {
          range: new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          text: foreachLoopBlock,
          forceMoveMarkers: true,
        },
      ]);
    },
  },
  {
    id: "surround-with-async-foreach-loop",
    label: "Surround with Async Foreach Loop",
    precondition: "editorHasSelection",
    run: (ed) => {
      const selection = ed.getSelection() as monaco.Selection;
      const selectedText = ed.getModel()?.getValueInRange(selection);

      const foreachLoopBlock =
        `array.forEach(async (element) => {\n` + `  ${selectedText}\n` + `});`;

      ed.executeEdits("", [
        {
          range: new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          text: foreachLoopBlock,
          forceMoveMarkers: true,
        },
      ]);
    },
  },
  {
    id: "surround-with-while-loop",
    label: "Surround with While Loop",
    precondition: "editorHasSelection",
    run: (ed) => {
      const selection = ed.getSelection() as monaco.Selection;
      const selectedText = ed.getModel()?.getValueInRange(selection);

      const whileLoopBlock =
        `while (condition) {\n` + `  ${selectedText}\n` + `}`;

      ed.executeEdits("", [
        {
          range: new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          text: whileLoopBlock,
          forceMoveMarkers: true,
        },
      ]);
    },
  },
  {
    id: "surrond-with-comment",
    label: "Surround with Comment",
    precondition: "editorHasSelection",
    run: (ed) => {
      const selection = ed.getSelection() as monaco.Selection;
      const selectedText = ed.getModel()?.getValueInRange(selection);

      const commentBlock = `/*\n` + `  ${selectedText}` + `\n*/`;

      ed.executeEdits("", [
        {
          range: new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          text: commentBlock,
          forceMoveMarkers: true,
        },
      ]);
    },
  },
  {
    id: "surround-with-function",
    label: "Surround with Function",
    precondition: "editorHasSelection",
    run: (ed) => {
      const selection = ed.getSelection() as monaco.Selection;
      const selectedText = ed.getModel()?.getValueInRange(selection);
      const functionBlock =
        `function functionName() {\n` + `  ${selectedText}\n` + `}` + `\n`;

      ed.executeEdits("", [
        {
          range: new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          text: functionBlock,
          forceMoveMarkers: true,
        },
      ]);
    },
  },
  {
    id: "surround-with-async-function",
    label: "Surround with Async Function",
    precondition: "editorHasSelection",
    run: (ed) => {
      const selection = ed.getSelection() as monaco.Selection;
      const selectedText = ed.getModel()?.getValueInRange(selection);
      const functionBlock =
        `async function functionName() {\n` + `  ${selectedText}\n` + `}`;
      ed.executeEdits("", [
        {
          range: new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          text: functionBlock,
          forceMoveMarkers: true,
        },
      ]);
    },
  },
  {
    id: "surround-with-arrow-function",
    label: "Surround with Arrow Function",
    precondition: "editorHasSelection",
    run: (ed) => {
      const selection = ed.getSelection() as monaco.Selection;
      const selectedText = ed.getModel()?.getValueInRange(selection);
      const functionBlock =
        `const functionName = () => {\n` + `  ${selectedText}\n` + `}`;

      ed.executeEdits("", [
        {
          range: new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          text: functionBlock,
          forceMoveMarkers: true,
        },
      ]);
    },
  },
  {
    id: "surround-with-async-arrow-function",
    label: "Surround with Async Arrow Function",
    precondition: "editorHasSelection",
    run: (ed) => {
      const selection = ed.getSelection() as monaco.Selection;
      const selectedText = ed.getModel()?.getValueInRange(selection);
      const functionBlock =
        `const functionName = async () => {\n` + `  ${selectedText}\n` + `}`;

      ed.executeEdits("", [
        {
          range: new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          text: functionBlock,
          forceMoveMarkers: true,
        },
      ]);
    },
  },
  {
    id: "surround-with-class",
    label: "Surround with Class",
    precondition: "editorHasSelection",
    run: (ed) => {
      const selection = ed.getSelection() as monaco.Selection;
      const selectedText = ed.getModel()?.getValueInRange(selection);
      const classBlock =
        `class ClassName {\n` +
        `  constructor() {\n` +
        `  }\n` +
        `  ${selectedText}\n` +
        `}`;

      ed.executeEdits("", [
        {
          range: new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          text: classBlock,
          forceMoveMarkers: true,
        },
      ]);
    },
  },
  {
    id: "surround-with-template-literal",
    label: "Surround with Template Literal",
    precondition: "editorHasSelection",
    run: (ed) => {
      const selection = ed.getSelection() as monaco.Selection;
      const selectedText = ed.getModel()?.getValueInRange(selection);
      const templateLiteralBlock = `\`${selectedText}\``;
      ed.executeEdits("", [
        {
          range: new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          text: templateLiteralBlock,
          forceMoveMarkers: true,
        },
      ]);
    },
  },
  {
    id: "surround-with-template-literal-variable",
    label: "Surround with Template Literal Variable",
    precondition: "editorHasSelection",
    run: (ed) => {
      const selection = ed.getSelection() as monaco.Selection;
      const selectedText = ed.getModel()?.getValueInRange(selection);
      const templateLiteralBlock = `\${${selectedText}}`;
      ed.executeEdits("", [
        {
          range: new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          text: templateLiteralBlock,
          forceMoveMarkers: true,
        },
      ]);
    },
  },
];

export const CRON_EXAMPLES = [
  "* * * * *",
  "0 * * * *",
  "0 0 * * *",
  "0 0 1 * *",
  "0 0 * * 0",
  "0 0 * * 1-5",
  "*/10 * * * *",
  "0 0,12 * * *",
  "0 2 1 * *",
  "0 0 1 1 *",
  "0 0 1 1,7 *",
  "0 15 10 * *",
  "0 45 4 1,10,22 * *",
  "0 0 1 * 0",
  "0 0 1 * 1",
  "5,10 0 * * *",
  "0 0 12 1-15 * 3",
  "0 22 * * 1-5",
  "23 0-20/2 * * *",
  "5 4 * * SUN",
];

export const CONTAINER_TYPES = [
  "deployment",
  "stateful set",
  "knative service",
  "cron job",
] as const;
