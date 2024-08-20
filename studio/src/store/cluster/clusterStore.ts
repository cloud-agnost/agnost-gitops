import { AuthService, ClusterService, UserService } from "@/services";
import {
  APIError,
  Cluster,
  ClusterComponent,
  ClusterComponentReleaseInfo,
  ClusterReleaseInfo,
  ClusterSetupResponse,
  DomainParams,
  EnforceSSLAccessParams,
  ModuleVersions,
  OnboardingData,
  TransferRequest,
  UpdateRemainingClusterComponentsParams,
} from "@/types";
import { BaseGetRequest, User, UserDataToRegister } from "@/types/type.ts";
import { sendMessageToChannel } from "@/utils";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import useAuthStore from "../auth/authStore";
import useOrganizationStore from "../organization/organizationStore";
import useProjectStore from "../project/projectStore";

interface ClusterStore {
  loading: boolean;
  error: APIError | null;
  isCompleted: boolean;
  clusterComponents: ClusterComponent[];
  isEditClusterComponentOpen: boolean;
  clusterComponent: ClusterComponent;
  clusterReleaseInfo: ClusterReleaseInfo | undefined;
  clusterComponentsReleaseInfo: ClusterComponentReleaseInfo[];
  cluster: Cluster;
  isReleaseHistoryOpen: boolean;
  clusterDomainError: APIError | undefined;
}

type Actions = {
  checkClusterSetup: () => Promise<boolean>;
  initializeClusterSetup: (data: UserDataToRegister) => Promise<User>;
  finalizeClusterSetup: (
    params: OnboardingData
  ) => Promise<ClusterSetupResponse>;
  openEditClusterComponent: (editedClusterComponent: ClusterComponent) => void;
  closeEditClusterComponent: () => void;
  transferClusterOwnership: (params: TransferRequest) => Promise<void>;
  getClusterInfo: () => Promise<any>;
  getClusterAndReleaseInfo: () => Promise<ClusterReleaseInfo>;
  updateClusterRelease: (param: {
    release: string;
  }) => Promise<ClusterReleaseInfo>;
  toggleReleaseHistory: () => void;
  addDomain: (data: DomainParams) => Promise<Cluster>;
  deleteDomain: (data: DomainParams) => Promise<Cluster>;
  enforceSSL: (data: EnforceSSLAccessParams) => Promise<Cluster>;
  checkDomainStatus: () => Promise<void>;
  getActiveUsers: (params: BaseGetRequest) => Promise<User[]>;
  updateRemainingClusterComponents: (
    data: UpdateRemainingClusterComponentsParams
  ) => Promise<ClusterComponent>;
  enabledCICD: () => Promise<Cluster>;
  disabledCICD: () => Promise<Cluster>;
  setReverseProxyURL: (url: string) => Promise<Cluster>;
  reset: () => void;
};

const initialState: ClusterStore = {
  loading: false,
  isCompleted: false,
  error: null,
  clusterComponents: [],
  clusterComponent: {} as ClusterComponent,
  isEditClusterComponentOpen: false,
  cluster: {} as Cluster,
  clusterReleaseInfo: {} as ClusterReleaseInfo,
  clusterComponentsReleaseInfo: [],
  isReleaseHistoryOpen: false,
  clusterDomainError: undefined,
};

const useClusterStore = create<ClusterStore & Actions>()(
  devtools((set) => ({
    ...initialState,
    checkClusterSetup: async () => {
      try {
        const { status } = await ClusterService.checkCompleted();
        set({ isCompleted: status });
        return status;
      } catch (error) {
        set({ error: error as APIError });
        throw error;
      }
    },
    initializeClusterSetup: async (data: UserDataToRegister) => {
      try {
        const user = await AuthService.initializeClusterSetup(data);
        useAuthStore.getState().setUser(user);
        return user;
      } catch (error) {
        set({ error: error as APIError });
        throw error;
      }
    },
    finalizeClusterSetup: async (params: OnboardingData) => {
      try {
        const clusterSetupResponse = await AuthService.finalizeClusterSetup(
          params
        );
        set({ isCompleted: true });
        const user = useAuthStore.getState().user;
        sendMessageToChannel("new_cluster", user);
        useOrganizationStore.setState({
          organization: {
            ...clusterSetupResponse.org,
            role: "Admin",
          },
        });
        useProjectStore.setState({
          project: clusterSetupResponse.project,
          projects: [clusterSetupResponse.project],
        });

        return clusterSetupResponse;
      } catch (error) {
        set({ error: error as APIError });
        throw error;
      }
    },
    updateRemainingClusterComponents: async (
      data: UpdateRemainingClusterComponentsParams
    ) => {
      try {
        const clusterComponent = await ClusterService.updateRemainingClusterComponents(
          data
        );
        set((state) => ({
          clusterComponents: state.clusterComponents.map((item) =>
            item.name === data.componentName
              ? {
                  ...item,
                  info: {
                    ...item.info,
                    pvcSize: data.config.size,
                    version: data.config.version,
                    configuredReplicas: data.config.replicas,
                  },
                }
              : item
          ),
        }));
        return clusterComponent;
      } catch (error) {
        set({ error: error as APIError });
        throw error;
      }
    },
    openEditClusterComponent: (editedClusterComponent) => {
      set({
        isEditClusterComponentOpen: true,
        clusterComponent: editedClusterComponent,
      });
    },
    closeEditClusterComponent: () => {
      set({
        isEditClusterComponentOpen: false,
        clusterComponent: {} as ClusterComponent,
      });
    },
    transferClusterOwnership: async (params: TransferRequest) => {
      await ClusterService.transferClusterOwnership(params);
      useAuthStore.setState((prev) => ({
        user: {
          ...prev.user,
          isClusterOwner: false,
        },
      }));
    },
    getClusterInfo: async () => {
      try {
        const cluster = await ClusterService.getClusterInfo();
        set({ cluster });
        return cluster;
      } catch (error) {
        set({ error: error as APIError });
        throw error;
      }
    },
    getClusterAndReleaseInfo: async () => {
      const clusterReleaseInfo = await ClusterService.getClusterAndReleaseInfo();
      set({
        clusterReleaseInfo: clusterReleaseInfo,
        clusterComponentsReleaseInfo: Object.entries(
          clusterReleaseInfo?.current?.modules ?? {}
        ).map(([module, version]) => ({
          module,
          version,

          latest:
            clusterReleaseInfo?.latest?.modules?.[
              module as keyof ModuleVersions
            ] ?? "",
        })),
      });
      return clusterReleaseInfo;
    },
    updateClusterRelease: async (param: { release: string }) => {
      const cluster = await ClusterService.updateClusterRelease(param);
      set((prev) => ({
        clusterReleaseInfo: {
          ...prev.clusterReleaseInfo,
          current: {
            ...prev.clusterReleaseInfo?.current,
            release: param.release,
          },
          ...cluster,
        },
      }));
      return cluster;
    },
    toggleReleaseHistory: () => {
      set((prev) => ({ isReleaseHistoryOpen: !prev.isReleaseHistoryOpen }));
    },
    addDomain: async (data: DomainParams) => {
      const cluster = await ClusterService.addDomain(data);
      set({ cluster });
      return cluster;
    },
    deleteDomain: async (data: DomainParams) => {
      const cluster = await ClusterService.deleteDomain(data);
      set({ cluster });
      return cluster;
    },
    enforceSSL: async (data: EnforceSSLAccessParams) => {
      const cluster = await ClusterService.enforceSSL(data);
      set({ cluster });
      return cluster;
    },
    checkDomainStatus: async () => {
      try {
        await ClusterService.checkDomainStatus();
      } catch (error) {
        set({ clusterDomainError: error as APIError });
        throw error;
      }
    },
    getActiveUsers: async (params) => {
      return await UserService.getActiveUsers(params);
    },
    enabledCICD: async () => {
      const cluster = await ClusterService.enabledCICD();
      set({ cluster });
      return cluster;
    },
    disabledCICD: async () => {
      const cluster = await ClusterService.disabledCICD();
      set({ cluster });
      return cluster;
    },
    setReverseProxyURL: async (url) => {
      const cluster = await ClusterService.setReverseProxyURL(url);
      set({ cluster });
      return cluster;
    },
    reset: () => set(initialState),
  }))
);

export default useClusterStore;
