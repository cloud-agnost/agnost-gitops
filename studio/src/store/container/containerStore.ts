import { ClusterService } from "@/services";
import ContainerService from "@/services/ContainerService";
import {
  AddGitProviderParams,
  Container,
  ContainerEvent,
  ContainerLog,
  ContainerPipeline,
  ContainerPipelineActions,
  ContainerPipelineLogs,
  ContainerPod,
  ContainerTemplate,
  ContainerType,
  CreateContainerParams,
  DeleteContainerParams,
  DeleteContainerPodParams,
  GetBranchesParams,
  GetContainerPipelineLogsParams,
  GetContainersInEnvParams,
  GitBranch,
  GitProvider,
  GitRepo,
  Template,
  UpdateContainerParams,
} from "@/types";
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
  lastFetchedPage?: number;
  selectedPod?: ContainerPod;
  isPodInfoOpen: boolean;
  selectedPipeline?: ContainerPipeline;
  templates?: ContainerTemplate[];
  template?: Template;
  containerPods?: ContainerPod[];
  containerLogs?: ContainerLog;
  containerEvents?: ContainerEvent[];
  containerPipelines?: ContainerPipeline[];
  containerPipelineLogs?: ContainerPipelineLogs[];
  providers?: GitProvider[];
};

type Actions = {
  openCreateContainerDialog: (type: ContainerType, template?: Template) => void;
  closeCreateContainerDialog: () => void;
  openEditContainerDialog: (container: Container, template?: Template) => void;
  closeEditContainerDialog: () => void;
  openDeleteContainerDialog: (container: Container) => void;
  closeDeleteContainerDialog: () => void;
  openPodInfo: (pod: ContainerPod) => void;
  closePodInfo: () => void;
  selectPipeline: (pipeline?: ContainerPipeline) => void;
  getGitProviders: () => Promise<GitProvider[]>;
  getGitProvider: (providerId: string) => Promise<GitProvider>;
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
  getContainerTemplates: () => Promise<ContainerTemplate[]>;
  getContainerTemplate: (name: string, version: string) => Promise<Template>;
  setSelectedPod: (pod: ContainerPod) => void;
  deletePod: (req: DeleteContainerPodParams) => Promise<void>;
  cancelRun: (req: ContainerPipelineActions) => Promise<void>;
  deleteRun: (req: ContainerPipelineActions) => Promise<void>;
  restartRun: (req: ContainerPipelineActions) => Promise<void>;
  triggerBuild: (req: DeleteContainerParams) => Promise<void>;
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
        openCreateContainerDialog: (type, template) =>
          set({
            isCreateContainerDialogOpen: true,
            createdContainerType: type,
            template,
          }),
        closeCreateContainerDialog: () =>
          set({
            isCreateContainerDialogOpen: false,
            createdContainerType: null,
            template: undefined,
          }),
        openEditContainerDialog: (container, template) => {
          set({ isEditContainerDialogOpen: true, container, template });
        },
        closeEditContainerDialog: () => {
          set({
            isEditContainerDialogOpen: false,
            container: null,
            selectedPipeline: undefined,
            template: undefined,
            selectedPod: undefined,
            containerPods: undefined,
            containerLogs: undefined,
            containerEvents: undefined,
            containerPipelines: undefined,
            containerPipelineLogs: undefined,
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
          return provider;
        },
        getGitProvider: async (providerId) => {
          const provider = await ContainerService.getGitProviderById(
            providerId
          );
          set({ providers: [provider] });
          return provider;
        },
        getGitProviders: async () => {
          const providers = await ContainerService.getGitProviders();
          set({ providers });
          return providers;
        },
        disconnectGitProvider: async (providerId) => {
          await ContainerService.disconnectGitProvider(providerId);
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
              ...state.containers.filter((en) => en._id !== container._id),
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
          const pods = await ContainerService.getContainerPods(req);
          set({ containerPods: pods });
          return pods;
        },
        getContainerLogs: async (req) => {
          const logs = await ContainerService.getContainerLogs(req);
          set({ containerLogs: logs });
          return logs;
        },
        getContainerEvents: async (req) => {
          const events = await ContainerService.getContainerEvents(req);
          set({ containerEvents: events });
          return events;
        },
        getContainerPipelines: async (req) => {
          const pipelines = await ContainerService.getContainerPipelines(req);
          set({ containerPipelines: pipelines });
          return pipelines;
        },
        getContainerPipelineLogs: async (req) => {
          const pipelinelogs = await ContainerService.getContainerPipelineLogs(
            req
          );
          set({ containerPipelineLogs: pipelinelogs });
          return pipelinelogs;
        },
        getContainerTemplates: async () => {
          const templates = await ClusterService.getContainerTemplates();
          set({
            templates,
          });
          return templates;
        },
        getContainerTemplate: async (name, version) => {
          const template = await ClusterService.getContainerTemplate(
            name,
            version
          );
          set({ template });
          return template;
        },
        setSelectedPod: (pod) => {
          set({ selectedPod: pod });
        },
        deletePod: async (req) => {
          await ContainerService.deleteContainerPod(req);
          set((state) => ({
            containerPods: state.containerPods?.filter(
              (pod) => pod.name !== req.podName
            ),
          }));
        },
        cancelRun: async (req) => {
          await ContainerService.cancelPipelineRun(req);
        },
        deleteRun: async (req) => {
          await ContainerService.deletePipelineRun(req);
          set((state) => ({
            containerPipelines: state.containerPipelines?.filter(
              (pipeline) => pipeline.name !== req.pipelineName
            ),
          }));
        },
        restartRun: async (req) => {
          await ContainerService.rerunPipeline(req);
        },
        triggerBuild: async (req) => {
          await ContainerService.triggerBuild(req);
        },
        reset: () => set(initialState),
      }),
      {
        name: "container-store",
        partialize: (state) => ({
          isCreateContainerDialogOpen: state.isCreateContainerDialogOpen,
          isEditContainerDialogOpen: state.isEditContainerDialogOpen,
          createdContainerType: state.createdContainerType,
          container: state.container,
        }),
      }
    )
  )
);

export default useContainerStore;
