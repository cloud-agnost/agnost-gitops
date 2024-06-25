import useAuthStore from "@/store/auth/authStore";
import useClusterStore from "@/store/cluster/clusterStore";
import useContainerStore from "@/store/container/containerStore";
import useOrganizationStore from "@/store/organization/organizationStore";
import useProjectEnvironmentStore from "@/store/project/projectEnvironmentStore";
import useProjectStore from "@/store/project/projectStore";
import useResourceStore from "@/store/resources/resourceStore";
import useThemeStore from "@/store/theme/themeStore";
import useTypeStore from "@/store/types/typeStore";
import { StoreApi, UseBoundStore } from "zustand";
export const STATE_LIST: Record<string, UseBoundStore<StoreApi<any>>> = {
  auth: useAuthStore,
  cluster: useClusterStore,
  organization: useOrganizationStore,
  resource: useResourceStore,
  theme: useThemeStore,
  types: useTypeStore,
  project: useProjectStore,
  environment: useProjectEnvironmentStore,
  container: useContainerStore,
};
