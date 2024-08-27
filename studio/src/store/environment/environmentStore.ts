import EnvironmentService from "@/services/EnvironmentService";
import {
  CreateNewEnvironmentRequest,
  DeleteEnvironmentRequest,
  Environment,
  GetEnvironmentByIdRequest,
  GetEnvironmentRequest,
  UpdateEnvironmentRequest,
} from "@/types";
import { history, joinChannel } from "@/utils";
import { create } from "zustand";
import useContainerStore from "../container/containerStore";
type EnvironmentStore = {
  environment: Environment;
  environments: Environment[];
  isCreateEnvironmentDrawerOpen: boolean;
  isDeleteEnvironmentModalOpen: boolean;
};

type Actions = {
  getEnvironments: (req: GetEnvironmentRequest) => Promise<Environment[]>;
  selectEnvironment: (environment: Environment) => void;
  getEnvironmentById: (req: GetEnvironmentByIdRequest) => Promise<Environment>;
  createEnvironment: (req: CreateNewEnvironmentRequest) => Promise<Environment>;
  updateEnvironment: (req: UpdateEnvironmentRequest) => Promise<Environment>;
  deleteEnvironment: (req: DeleteEnvironmentRequest) => Promise<void>;
  toggleCreateEnvironmentDrawer: () => void;
  toggleDeleteEnvironmentModal: () => void;
  reset: () => void;
};

const initialState: EnvironmentStore = {
  environment: {} as Environment,
  environments: [],
  isCreateEnvironmentDrawerOpen: false,
  isDeleteEnvironmentModalOpen: false,
};

const useEnvironmentStore = create<EnvironmentStore & Actions>((set, get) => ({
  ...initialState,
  getEnvironments: async (req: GetEnvironmentRequest) => {
    const environments = await EnvironmentService.getEnvironments(req);
    set({ environments });
    return environments;
  },
  getEnvironmentById: async (req: GetEnvironmentByIdRequest) => {
    const environment = await EnvironmentService.getEnvironment(req);
    set({ environment });
    joinChannel(environment._id);
    return environment;
  },
  selectEnvironment: (environment) => {
    if (environment._id === get().environment._id) return;
    get().reset();
    set({ environment });
    joinChannel(environment._id);
    useContainerStore.getState().reset();
    history.navigate?.(
      `/organization/${environment.orgId}/projects/${environment.projectId}/env/${environment._id}`
    );
  },
  createEnvironment: async (req: CreateNewEnvironmentRequest) => {
    const environment = await EnvironmentService.createEnvironment(req);
    set((prev) => ({ environments: [...prev.environments, environment] }));
    return environment;
  },
  updateEnvironment: async (req: UpdateEnvironmentRequest) => {
    const environment = await EnvironmentService.updateEnvironment(req);
    set((prev) => ({
      environments: prev.environments.map((env) =>
        env._id === environment._id ? environment : env
      ),
      environment,
    }));
    return environment;
  },
  deleteEnvironment: async (req: DeleteEnvironmentRequest) => {
    await EnvironmentService.deleteEnvironment(req);
    set((prev) => ({
      environments: prev.environments.filter((env) => env._id !== req.envId),
    }));
  },
  toggleCreateEnvironmentDrawer: () => {
    set((prev) => ({
      isCreateEnvironmentDrawerOpen: !prev.isCreateEnvironmentDrawerOpen,
    }));
  },
  toggleDeleteEnvironmentModal: () => {
    set((prev) => ({
      isDeleteEnvironmentModalOpen: !prev.isDeleteEnvironmentModalOpen,
    }));
  },
  reset: () => set({ ...initialState }),
}));

export default useEnvironmentStore;
