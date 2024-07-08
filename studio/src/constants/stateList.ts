// import useAuthStore from "@/store/auth/authStore";
import useClusterStore from "@/store/cluster/clusterStore";
import useContainerStore from "@/store/container/containerStore";
import useEnvironmentStore from "@/store/environment/environmentStore";
import useNotificationStore from "@/store/notification/notificationStore";
import useOrganizationStore from "@/store/organization/organizationStore";
import useProjectStore from "@/store/project/projectStore";
import useThemeStore from "@/store/theme/themeStore";
import useTypeStore from "@/store/types/typeStore";
import { StoreApi, UseBoundStore } from "zustand";
export const STATE_LIST: Record<string, UseBoundStore<StoreApi<any>>> = {
  // auth: useAuthStore,
  cluster: useClusterStore,
  container: useContainerStore,
  environment: useEnvironmentStore,
  notification: useNotificationStore,
  organization: useOrganizationStore,
  project: useProjectStore,
  theme: useThemeStore,
  types: useTypeStore,
};
