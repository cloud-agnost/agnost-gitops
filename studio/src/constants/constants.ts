import Tools from "@/assets/images/complete_set_of_tools.webp";
import CronJobs from "@/assets/images/cron_jobs.webp";
import Database from "@/assets/images/database.png";
import FasterDevelopment from "@/assets/images/faster_development.webp";
import Queue from "@/assets/images/message_queues.webp";
import RealtimeCollaboration from "@/assets/images/realtime_collaboration.webp";
import Security from "@/assets/images/security.webp";
import Serverless from "@/assets/images/serverless_functions.webp";

import {
  Awss3,
  AzureBlobStorage,
  GcpStorage,
  Kafka,
  MinIo,
  MongoDb,
  MySql,
  Nodejs,
  PostgreSql,
  RabbitMq,
  React,
  Redis,
  Resource,
  SocketIo,
} from "@/components/icons";
import {
  ConnectAWS,
  ConnectAzure,
  ConnectCache,
  ConnectDatabase,
  ConnectGCP,
  ConnectQueue,
} from "@/features/resources";
import useAuthStore from "@/store/auth/authStore";
import useProjectStore from "@/store/project/projectStore";
import {
  Instance,
  Project,
  ProjectRole,
  ResourceCreateType,
  ResourceInstances,
  ResourceType,
  SortOption,
} from "@/types";
import { getProjectPermission, translate } from "@/utils";
import {
  Bell,
  ClockCounterClockwise,
  EjectSimple,
  Envelope,
  FileText,
  GearSix,
  GitBranch,
  HardDrive,
  LineSegments,
  PencilSimple,
  Plus,
  ProjectorScreenChart,
  SignOut,
  Trash,
  UserPlus,
  Users,
} from "@phosphor-icons/react";
import { BadgeColors } from "components/Badge/Badge.tsx";
import { ElementType } from "react";

export const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;
export const BASE_URL_WITH_API = `${BASE_URL}/api`;
export const PAGE_SIZE = 10;
export const MODULE_PAGE_SIZE = 250;
export const UI_BASE_URL = window.location.origin;

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

export const PROJECT_SETTINGS = [
  {
    id: "environment",
    name: translate("project.settings.openEnv"),
    onClick: (project: Project) => {
      useProjectStore.getState().onProjectClick(project);
    },
    isDisabled: (role: ProjectRole) =>
      !getProjectPermission("version.view", role),
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
    isDisabled: (role: ProjectRole) => !getProjectPermission("update", role),
    icon: PencilSimple,
  },
  {
    id: "invite",
    name: translate("general.addMembers"),
    onClick: (project: Project) => {
      useProjectStore.getState().openInviteMemberModal(project);
    },
    isDisabled: (role: ProjectRole) =>
      !getProjectPermission("invite.create", role),
    icon: UserPlus,
  },
  {
    id: "leave-app",
    name: translate("project.settings.leaveTeam"),
    onClick: (project: Project) => {
      useProjectStore.getState().openLeaveModal(project);
    },
    isDisabled: (_role: ProjectRole, project: Project) => {
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
    isDisabled: (role: ProjectRole) => !getProjectPermission("delete", role),
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
  "resource",
  "cluster",
  "project",
  "environment",
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

export const RESOURCE_TYPES = [
  {
    id: "database",
    name: translate("resources.type.database"),
    icon: Resource,
  },
  {
    id: "storage",
    name: translate("resources.type.storage"),
    icon: Storage,
  },
  {
    id: "cache",
    name: translate("resources.type.cache"),
    icon: HardDrive,
  },
  {
    id: "message-queue",
    name: translate("resources.type.mq"),
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

export const CREATE_RESOURCES_ELEMENTS = [
  {
    name: translate("resources.type.database"),
    resourceType: ResourceType.Database,
    instance: ResourceType.Database,
    CurrentResourceElement: ConnectDatabase,
  },
  {
    name: translate("resources.type.storage"),
    resourceType: ResourceType.Storage,
    instance: ResourceInstances.GCPStorage,
    CurrentResourceElement: ConnectGCP,
  },
  {
    name: translate("resources.type.storage"),
    resourceType: ResourceType.Storage,
    instance: ResourceInstances.AWSS3,
    CurrentResourceElement: ConnectAWS,
  },
  {
    name: translate("resources.type.storage"),
    resourceType: ResourceType.Storage,
    instance: ResourceInstances.AzureBlob,
    CurrentResourceElement: ConnectAzure,
  },
  {
    name: translate("resources.type.cache"),
    resourceType: ResourceType.Cache,
    instance: ResourceInstances.Redis,
    CurrentResourceElement: ConnectCache,
  },
  {
    name: translate("resources.type.mq"),
    resourceType: ResourceType.Queue,
    instance: ResourceInstances.RabbitMQ,
    CurrentResourceElement: ConnectQueue,
  },
];

export const RABBITMQ_CONNECTION_TYPES = ["url", "object"] as const;
export const RABBITMQ_CONNECTION_SCHEMES = ["amqp", "amqps"] as const;
export const KAFKA_CONNECTION_SCHEMES = ["simple", "ssl", "sasl"] as const;
export const KAFKA_SASL_MECHANISM = [
  "plain",
  "scram-sha-256",
  "scram-sha-512",
] as const;
export const MONGODB_CONNECTION_FORMATS = ["mongodb+srv", "mongodb"] as const;

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

export const INSTANCE_PORT_MAP: Record<string, number> = {
  PostgreSQL: 5432,
  MySQL: 3306,
  "SQL Server": 1433,
  MongoDB: 27017,
  Oracle: 1521,
  Redis: 6379,
  RabbitMQ: 5672,
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

export const RESOURCE_ICON_MAP: Record<string, ElementType> = {
  MongoDB: MongoDb,
  MySQL: MySql,
  PostgreSQL: PostgreSql,
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

export const ORG_CHANGE_EXCEPTIONS = [
  "organization",
  "theme",
  "types",
  "cluster",
  "auth",
];

export const FORBIDDEN_RESOURCE_NAMES = [
  "mongodb",
  "rabbitmq-server",
  "redis-master",
  "redis",
  "redis-headless",
  "rabbitmq",
  "minio",
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

export const EDIT_PROJECT_MENU_ITEMS = [
  {
    name: translate("project.edit.general"),
    href: "general",
  },
  {
    name: translate("project.edit.members"),
    href: "members",
  },
  {
    name: translate("project.edit.invitations"),
    href: "invitations",
  },
];
export const FIELD_MAPPER: Record<string, string> = {
  createdat: "datetime",
  updatedat: "datetime",
  parent: "reference",
};
