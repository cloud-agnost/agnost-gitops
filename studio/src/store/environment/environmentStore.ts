import { create } from '@/helpers/store';
import {
	APIError,
	EnvLog,
	Environment,
	GetEnvironmentLogDetailsParams,
	GetEnvironmentLogsParams,
	GetEnvironmentResourcesParams,
	Resource,
	SelectedEnvLog,
	ToggleAutoDeployParams,
	UpdateAPIServerConfParams,
	UpdateEnvironmentTelemetryLogsParams,
	VersionParams,
	getAppVersionEnvironmentParams,
} from '@/types';
import { DATE_TIME_FORMAT, formatDate, joinChannel } from '@/utils';
import EnvironmentService from 'services/EnvironmentService.ts';
import { devtools, persist } from 'zustand/middleware';

interface EnvironmentStore {
	environments: Environment[];
	environment: Environment;
	resources: Resource[];
	envLogs: EnvLog[];
	selectedLog: SelectedEnvLog;
	isLogDetailsOpen: boolean;
	log: EnvLog;
}

type Actions = {
	openLogDetails: (log: EnvLog) => void;
	closeLogDetails: () => void;
	getAppVersionEnvironment: (params: getAppVersionEnvironmentParams) => Promise<Environment>;
	getEnvironmentLogs: (params: GetEnvironmentLogsParams) => Promise<void>;
	getEnvironmentLogsDetail: (params: GetEnvironmentLogDetailsParams) => Promise<void>;
	toggleAutoDeploy: (params: ToggleAutoDeployParams) => Promise<Environment>;
	suspendEnvironment: (params: VersionParams) => Promise<void>;
	activateEnvironment: (params: VersionParams) => Promise<void>;
	redeployAppVersionToEnvironment: (params: VersionParams) => Promise<void>;
	restartApiServers: (params: VersionParams) => Promise<void>;
	updateEnvironmentTelemetryLogs: (params: UpdateEnvironmentTelemetryLogsParams) => Promise<any>;
	getEnvironmentResources: (params: GetEnvironmentResourcesParams) => Promise<Resource[]>;
	updateApiServerConf: (params: UpdateAPIServerConfParams) => Promise<void>;
	reset: () => void;
};

const initialState: EnvironmentStore = {
	environments: [],
	environment: {} as Environment,
	resources: [],
	envLogs: [],
	selectedLog: {} as SelectedEnvLog,
	log: {} as EnvLog,
	isLogDetailsOpen: false,
};

const useEnvironmentStore = create<EnvironmentStore & Actions>()(
	devtools(
		persist(
			(set) => ({
				...initialState,
				getAppVersionEnvironment: async (params: getAppVersionEnvironmentParams) => {
					const environment = await EnvironmentService.getAppVersionEnvironment(params);
					set({ environment });
					joinChannel(environment._id);
					return environment;
				},
				getEnvironmentLogs: async (params: GetEnvironmentLogsParams) => {
					const logs = await EnvironmentService.getEnvironmentLogs(params);
					set({ envLogs: logs });
				},
				getEnvironmentLogsDetail: async (params: GetEnvironmentLogDetailsParams) => {
					const log = await EnvironmentService.getEnvironmentLogsDetail(params);

					const selectedLog = {
						dbLogs: log.dbLogs?.map((log) => ({
							timestamp: formatDate(log.startedAt, DATE_TIME_FORMAT),
							message: log.message,
							type: log.status,
						})),
						serverLogs: log.serverLogs?.map((log) => ({
							timestamp: formatDate(log.startedAt, DATE_TIME_FORMAT),
							message: log.message,
							type: log.status,
							pod: log.pod,
						})),
						schedulerLogs: log.schedulerLogs?.map((log) => ({
							timestamp: formatDate(log.startedAt, DATE_TIME_FORMAT),
							message: log.message,
							type: log.status,
						})),
					} as SelectedEnvLog;

					set((prev) => ({
						selectedLog,
						envLogs: prev.envLogs.map((envLog) => {
							if (envLog._id === log._id) {
								return log;
							}
							return envLog;
						}),
					}));
				},
				toggleAutoDeploy: async (params: ToggleAutoDeployParams) => {
					try {
						const environment = await EnvironmentService.toggleAutoDeploy(params);
						set({ environment });
						return environment;
					} catch (e) {
						throw e as APIError;
					}
				},
				suspendEnvironment: async (params: VersionParams) => {
					try {
						const environment = await EnvironmentService.suspendEnvironment(params);
						set({ environment });
					} catch (e) {
						throw e as APIError;
					}
				},
				activateEnvironment: async (params: VersionParams) => {
					try {
						const environment = await EnvironmentService.activateEnvironment(params);
						set({ environment });
					} catch (e) {
						throw e as APIError;
					}
				},
				redeployAppVersionToEnvironment: async (params: VersionParams) => {
					try {
						const environment = await EnvironmentService.redeployAppVersionToEnvironment(params);
						set({ environment });
					} catch (error) {
						throw error as APIError;
					}
				},
				restartApiServers: async (params: VersionParams) => {
					try {
						return await EnvironmentService.restartApiServers(params);
					} catch (error) {
						throw error as APIError;
					}
				},
				updateEnvironmentTelemetryLogs: (params: UpdateEnvironmentTelemetryLogsParams) => {
					return EnvironmentService.updateEnvironmentTelemetryLogs(params);
				},
				getEnvironmentResources: async (params: GetEnvironmentResourcesParams) => {
					const resources = await EnvironmentService.getEnvironmentResources(params);
					resources.forEach((resource) => {
						joinChannel(resource._id);
					});
					set({ resources });
					return resources;
				},
				openLogDetails: (log: EnvLog) => {
					set({ log, isLogDetailsOpen: true });
				},
				closeLogDetails: () => {
					set({ selectedLog: {} as SelectedEnvLog, isLogDetailsOpen: false });
				},
				updateApiServerConf: async (params: UpdateAPIServerConfParams) => {
					try {
						const apiServer = await EnvironmentService.updateAPIServerConf(params);
						set((prev) => ({
							resources: prev.resources.map((resource) => {
								if (resource._id === apiServer._id) {
									return { ...resource, ...apiServer };
								}
								return resource;
							}),
						}));
						if (params.onSuccess) params.onSuccess();
					} catch (e) {
						if (params.onError) params.onError(e as APIError);
						throw e;
					}
				},
				reset: () => set(initialState),
			}),
			{
				name: 'environment-store',
				partialize: (state) =>
					Object.fromEntries(
						Object.entries(state).filter(([key]) => ['environment'].includes(key)),
					),
			},
		),
	),
);

export default useEnvironmentStore;
