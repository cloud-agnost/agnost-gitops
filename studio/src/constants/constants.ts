import useAuthStore from "@/store/auth/authStore";
import useProjectStore from "@/store/project/projectStore";
import { Project, ProjectRole, SortOption } from "@/types";
import { getProjectPermission, translate } from "@/utils";
import {
  ClockCounterClockwise,
  FileText,
  GearSix,
  GitBranch,
  PencilSimple,
  SignOut,
  Trash,
  UserPlus,
  Users,
} from "@phosphor-icons/react";
import { BadgeColors } from "components/Badge/Badge.tsx";

export const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;
export const BASE_URL_WITH_API = `${BASE_URL}/api`;
export const PAGE_SIZE = 10;
export const MODULE_PAGE_SIZE = 250;
export const UI_BASE_URL = window.location.origin;

export const MENU_ITEMS = [
  {
    title: "Change Log",
    url: "https://github.com/cloud-agnost/agnost-gitops/releases",
    icon: ClockCounterClockwise,
  },
  {
    title: "Docs",
    url: "https://agnost.dev/docs/intro",
    icon: FileText,
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
      !getProjectPermission("container.view", role),
    icon: GitBranch,
  },
  {
    id: "update",
    name: translate("project.settings.editProject"),
    onClick: (project: Project) => {
      useProjectStore.getState().openEditProjectDrawer(project);
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
    title: translate("general.settings"),
    href: "/organization/:id/settings",
    icon: GearSix,
  },
  {
    title: translate("organization.settings.members.title"),
    href: "/organization/:id/settings/members",
    icon: Users,
  },
];

export const ALL_NOTIFICATIONS = ["org", "project", "environment", "container"];

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

export const INVITATIONS_SORT_OPTIONS: SortOption[] = [
  {
    name: translate("general.sortOptions.inviteDate"),
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
  ISSUING: "blue",
  ISSUED: "green",
  "NOT READY": "orange",
  CREATE: "blue",
  UPDATE: "yellow",
  DELETE: "red",
  ACCEPT: "purple",
  TERMINATING: "red",
  SCHEDULED: "yellow",
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

export const ORG_CHANGE_EXCEPTIONS = [
  "organization",
  "theme",
  "types",
  "cluster",
  "auth",
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
  "statefulset",
  "cronjob",
] as const;

export const CLUSTER_MENU_ITEMS = [
  {
    name: translate("project.edit.general"),
    href: "general",
  },
  {
    name: "Usage",
    href: "usage",
  },
];
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
