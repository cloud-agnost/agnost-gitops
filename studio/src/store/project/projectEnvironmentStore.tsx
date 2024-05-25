import ProjectEnvironmentService from '@/services/ProjectEnvironmentService';
import {
	ProjectEnvironment,
	GetProjectEnvironmentRequest,
	GetProjectEnvironmentByIdRequest,
	CreateNewEnvironmentRequest,
	UpdateEnvironmentRequest,
	DeleteEnvironmentRequest,
} from '@/types';
import { history, joinChannel } from '@/utils';
import { create } from 'zustand';
type ProjectEnvironmentStore = {
	environment: ProjectEnvironment;
	environments: ProjectEnvironment[];
	lastFetchedPage: number | undefined;
	isCreateEnvironmentDrawerOpen: boolean;
	isDeleteEnvironmentModalOpen: boolean;
};

type Actions = {
	getProjectEnvironments: (req: GetProjectEnvironmentRequest) => Promise<ProjectEnvironment[]>;
	selectEnvironment: (environment: ProjectEnvironment) => void;
	getProjectEnvironmentById: (req: GetProjectEnvironmentByIdRequest) => Promise<ProjectEnvironment>;
	createEnvironment: (req: CreateNewEnvironmentRequest) => Promise<ProjectEnvironment>;
	updateEnvironment: (req: UpdateEnvironmentRequest) => Promise<ProjectEnvironment>;
	deleteEnvironment: (req: DeleteEnvironmentRequest) => Promise<void>;
	toggleCreateEnvironmentDrawer: () => void;
	toggleDeleteEnvironmentModal: () => void;
};

const initialState: ProjectEnvironmentStore = {
	environment: {} as ProjectEnvironment,
	environments: [],
	lastFetchedPage: undefined,
	isCreateEnvironmentDrawerOpen: false,
	isDeleteEnvironmentModalOpen: false,
};

const useProjectEnvironmentStore = create<ProjectEnvironmentStore & Actions>((set) => ({
	...initialState,
	getProjectEnvironments: async (req: GetProjectEnvironmentRequest) => {
		const environments = await ProjectEnvironmentService.getProjectEnvironments(req);
		if (req.page === 0) {
			set({ environments, lastFetchedPage: req.page });
		} else {
			set((prev) => ({
				environments: [...prev.environments, ...environments],
				lastFetchedPage: req.page,
			}));
		}
		return environments;
	},
	getProjectEnvironmentById: async (req: GetProjectEnvironmentByIdRequest) => {
		const environment = await ProjectEnvironmentService.getEnvironment(req);
		set({ environment });
		joinChannel(environment._id);
		return environment;
	},
	selectEnvironment: (environment) => {
		set({ environment });
		joinChannel(environment._id);
		// TODO: resetAfterVersionChange();
		history.navigate?.(
			`/organization/${environment.orgId}/projects/${environment.projectId}/env/${environment._id}`,
		);
	},
	createEnvironment: async (req: CreateNewEnvironmentRequest) => {
		const environment = await ProjectEnvironmentService.createEnvironment(req);

		set((prev) => ({ environments: [...prev.environments, environment] }));
		return environment;
	},
	updateEnvironment: async (req: UpdateEnvironmentRequest) => {
		const environment = await ProjectEnvironmentService.updateEnvironment(req);
		set((prev) => ({
			environments: prev.environments.map((env) =>
				env._id === environment._id ? environment : env,
			),
			environment,
		}));
		return environment;
	},
	deleteEnvironment: async (req: DeleteEnvironmentRequest) => {
		await ProjectEnvironmentService.deleteEnvironment(req);
		set((prev) => ({
			environments: prev.environments.filter((env) => env._id !== req.envId),
		}));
	},
	toggleCreateEnvironmentDrawer: () => {
		set((prev) => ({ isCreateEnvironmentDrawerOpen: !prev.isCreateEnvironmentDrawerOpen }));
	},
	toggleDeleteEnvironmentModal: () => {
		set((prev) => ({ isDeleteEnvironmentModalOpen: !prev.isDeleteEnvironmentModalOpen }));
	},
}));

export default useProjectEnvironmentStore;
