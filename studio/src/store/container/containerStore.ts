import ContainerService from "@/services/ContainerService";
import {
  AddGitProviderParams,
  Container,
  ContainerEvent,
  ContainerLog,
  ContainerPipeline,
  ContainerPipelineLogs,
  ContainerPod,
  ContainerType,
  CreateContainerParams,
  DeleteContainerParams,
  GetBranchesParams,
  GetContainerPipelineLogsParams,
  GetContainersInEnvParams,
  GitBranch,
  GitProvider,
  GitRepo,
  UpdateContainerParams,
} from "@/types/container";
import { joinChannel, leaveChannel } from "@/utils";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

type ContainerState = {
  containers: Container[];
  container: Container | null;
  toDeleteContainer: Container | null;
  isDeleteContainerDialogOpen: boolean;
  isCreateContainerDialogOpen: boolean;
  isEditContainerDialogOpen: boolean;
  createdContainerType: ContainerType | null;
  gitProvider?: GitProvider;
  lastFetchedPage?: number;
  selectedPod?: ContainerPod;
  isPodInfoOpen: boolean;
  selectedPipeline?: ContainerPipeline;
};

type Actions = {
  openCreateContainerDialog: (type: ContainerType) => void;
  closeCreateContainerDialog: () => void;
  openEditContainerDialog: (container: Container) => void;
  closeEditContainerDialog: () => void;
  openDeleteContainerDialog: (container: Container) => void;
  closeDeleteContainerDialog: () => void;
  openPodInfo: (pod: ContainerPod) => void;
  closePodInfo: () => void;
  selectPipeline: (pipeline?: ContainerPipeline) => void;
  addGitProvider: (req: AddGitProviderParams) => Promise<GitProvider>;
  disconnectGitProvider: (providerId: string) => Promise<void>;
  getGitRepositories: (providerId: string) => Promise<GitRepo[]>;
  getBranches: (req: GetBranchesParams) => Promise<GitBranch[]>;
  createContainer: (req: CreateContainerParams) => Promise<void>;
  getContainersInEnv: (req: GetContainersInEnvParams) => Promise<Container[]>;
  updateContainer: (req: UpdateContainerParams) => Promise<Container>;
  deleteContainer: (req: DeleteContainerParams) => Promise<void>;
  getContainerPods: (req: DeleteContainerParams) => Promise<ContainerPod[]>;
  getContainerLogs: (req: DeleteContainerParams) => Promise<ContainerLog>;
  getContainerEvents: (req: DeleteContainerParams) => Promise<ContainerEvent[]>;
  getContainerPipelines: (
    req: DeleteContainerParams
  ) => Promise<ContainerPipeline[]>;
  getContainerPipelineLogs: (
    req: GetContainerPipelineLogsParams
  ) => Promise<ContainerPipelineLogs[]>;
  reset: () => void;
};

const initialState: ContainerState = {
  isCreateContainerDialogOpen: false,
  isEditContainerDialogOpen: false,
  isDeleteContainerDialogOpen: false,
  container: null,
  createdContainerType: null,
  containers: [],
  lastFetchedPage: undefined,
  toDeleteContainer: null,
  isPodInfoOpen: false,
};

const useContainerStore = create<ContainerState & Actions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        openCreateContainerDialog: (type) =>
          set({
            isCreateContainerDialogOpen: true,
            createdContainerType: type,
          }),
        closeCreateContainerDialog: () =>
          set({
            isCreateContainerDialogOpen: false,
            createdContainerType: null,
          }),
        openEditContainerDialog: (container) => {
          set({ isEditContainerDialogOpen: true, container });
        },
        closeEditContainerDialog: () => {
          set({
            isEditContainerDialogOpen: false,
            container: null,
            selectedPipeline: undefined,
          });
        },
        openDeleteContainerDialog: (container) => {
          set({
            toDeleteContainer: container,
            isDeleteContainerDialogOpen: true,
          });
        },
        closeDeleteContainerDialog: () => {
          set({ toDeleteContainer: null, isDeleteContainerDialogOpen: false });
        },
        openPodInfo: (pod) => {
          set({ selectedPod: pod, isPodInfoOpen: true });
        },
        closePodInfo: () => {
          set({ selectedPod: undefined, isPodInfoOpen: false });
        },
        selectPipeline: (pipeline) => {
          set({ selectedPipeline: pipeline });
        },
        addGitProvider: async (req) => {
          const provider = await ContainerService.addGitProvider(req);
          set({ gitProvider: provider });
          return provider;
        },
        disconnectGitProvider: async (providerId) => {
          await ContainerService.disconnectGitProvider(providerId);
          set({ gitProvider: {} as GitProvider });
        },
        getGitRepositories: async (providerId) => {
          return await ContainerService.getGitRepositories(providerId);
        },
        getBranches: async (req) => {
          return await ContainerService.getGitBranches(req);
        },
        createContainer: async (req) => {
          const container = await ContainerService.createContainer(req);
          joinChannel(container._id);
          set((state) => ({
            containers: [
              ...state.containers,
              {
                ...container,
                status: {
                  status: "Pending",
                  availableReplicas: 0,
                  conditions: [],
                  observedGeneration: 0,
                  readyReplicas: 0,
                  creationTimestamp: new Date().toISOString(),
                  replicas: 0,
                  updatedReplicas: 0,
                },
              },
            ],
          }));
        },
        getContainersInEnv: async (req) => {
          const containers = await ContainerService.getContainersInEnv(req);
          if (req.page === 0) {
            set({ containers, lastFetchedPage: req.page });
          } else {
            set((prev) => ({
              containers: [...prev.containers, ...containers],
              lastFetchedPage: req.page,
            }));
          }
          containers.forEach((container) => {
            joinChannel(container._id);
          });
          return containers;
        },
        updateContainer: async (req) => {
          const container = await ContainerService.updateContainer(req);

          set((state) => ({
            containers: state.containers.map((c) =>
              c._id === container._id ? container : c
            ),
          }));

          return container;
        },
        deleteContainer: async (req) => {
          await ContainerService.deleteContainer(req);
          leaveChannel(req.containerId);
          set((state) => ({
            containers: state.containers.filter(
              (c) => c._id !== req.containerId
            ),
          }));
        },
        getContainerPods: async (req) => {
          return await ContainerService.getContainerPods(req);
        },
        getContainerLogs: async (req) => {
          return await ContainerService.getContainerLogs(req);
        },
        getContainerEvents: async (req) => {
          return await ContainerService.getContainerEvents(req);
        },
        getContainerPipelines: async (req) => {
          return await ContainerService.getContainerPipelines(req);
        },
        getContainerPipelineLogs: async (req) => {
          return await ContainerService.getContainerPipelineLogs(req);
        },

        reset: () => set(initialState),
      }),
      {
        name: "container-store",
        partialize: (state) => ({
          isCreateContainerDialogOpen: state.isCreateContainerDialogOpen,
          isEditContainerDialogOpen: state.isEditContainerDialogOpen,
          createdContainerType: state.createdContainerType,
          gitProvider: state.gitProvider,
          container: state.container,
        }),
      }
    )
  )
);

export default useContainerStore;
