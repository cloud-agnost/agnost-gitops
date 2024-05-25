import { CustomStateStorage } from '@/helpers/state';
import { create } from '@/helpers/store';
import {
	ColumnFilterType,
	ConditionsType,
	EndpointLogs,
	EndpointRequest,
	EndpointResponse,
	Filters,
	Log,
	TabTypes,
	TestEndpointParams,
	TestQueueLogs,
	TestResponse,
	TestTaskLogs,
	VersionColumnFilters,
} from '@/types';
import { filterMatchingKeys, getTypeWorker } from '@/utils';
import { ColumnState } from 'ag-grid-community';
import { endOfDay, startOfDay } from 'date-fns';
import _ from 'lodash';
import { devtools, persist } from 'zustand/middleware';
import useEndpointStore from '../endpoint/endpointStore';
import useVersionStore from './versionStore';

interface UtilsStore {
	endpointRequest: EndpointRequest;
	endpointResponse: EndpointResponse;
	endpointLogs: EndpointLogs;
	testQueueLogs: TestQueueLogs;
	taskLogs: TestTaskLogs;
	typings: Record<string, string>;
	sidebar: {
		[version: string]: {
			openEditor: boolean | undefined;
			openedTabs: string[] | undefined;
		};
	};
	isSidebarOpen: boolean;
	columnState: {
		[entityId: string]: ColumnState[] | undefined;
	};
	isAppliedToAllEndpoints: boolean;
	columnFilters: VersionColumnFilters | undefined;
}

type Actions = {
	setEndpointRequest: (request: TestEndpointParams) => void;
	setEndpointResponse: (response: TestResponse, epId: string) => void;
	setTestQueueLogs: (payload: string, queueId: string) => void;
	setQueueLogs: (queueId: string, log: Log) => void;
	setTypings: (packages: Record<string, string>) => void;
	setTaskLogs: (taskId: string, log: Log) => void;
	setEndpointLogs: (epId: string, log: Log) => void;
	fetchTypes: (packages: Record<string, string>) => Promise<void>;
	toggleOpenEditorTab: () => void;
	toggleWorkspaceTab: (tab: TabTypes) => void;
	toggleSidebar: () => void;
	saveColumnState: (modelId: string, state: ColumnState[]) => void;
	getColumnState: (modelId: string) => ColumnState[] | undefined;
	resetColumnState: (modelId: string) => void;
	collapseAll: () => void;
	setColumnFilters: (columnName: string, filter: ColumnFilterType, entityId: string) => void;
	clearAllColumnFilters: (entityId: string) => void;
	clearColumnFilter: (entityId: string, columnName: string) => void;
	clearEndpointsRequestHeaders: () => void;
	applyTokensToAllEndpoints: () => void;
	clearLogColumnFilter: (type: string) => void;
	clearTokens: () => void;
};

const initialState: UtilsStore = {
	endpointRequest: {} as EndpointRequest,
	endpointResponse: {} as EndpointResponse,
	testQueueLogs: {} as TestQueueLogs,
	taskLogs: {} as TestTaskLogs,
	typings: {} as Record<string, string>,
	endpointLogs: {} as EndpointLogs,
	sidebar: {} as UtilsStore['sidebar'],
	isSidebarOpen: true,
	columnState: {} as UtilsStore['columnState'],
	columnFilters: undefined,
	isAppliedToAllEndpoints: true,
};

const useUtilsStore = create<UtilsStore & Actions>()(
	devtools(
		persist(
			(set, get) => ({
				...initialState,
				setEndpointRequest: (request) => {
					set((prev) => ({
						endpointRequest: { ...prev.endpointRequest, [request.epId]: request },
					}));
				},
				setEndpointResponse: (response, epId) => {
					set((prev) => ({
						endpointResponse: {
							...prev.endpointResponse,
							[epId]: response,
						},
					}));
				},
				setTestQueueLogs: (payload, queueId) => {
					set((prev) => ({
						testQueueLogs: {
							...prev.testQueueLogs,
							[queueId]: {
								payload,
								logs: [],
							},
						},
					}));
				},
				setQueueLogs: (queueId: string, log: Log) => {
					set((prev) => ({
						testQueueLogs: {
							...prev.testQueueLogs,
							[queueId]: {
								...prev.testQueueLogs[queueId],
								logs: [...(prev.testQueueLogs[queueId]?.logs ?? []), log],
							},
						},
					}));
				},
				setTypings: (packages) => {
					const typeWorker = getTypeWorker();
					const intersection = filterMatchingKeys(get().typings, packages);
					typeWorker.postMessage(intersection);
					typeWorker.onmessage = async function (e) {
						const typings = e.data;
						const specifics = await useVersionStore.getState().getTypings();
						set((prev) => ({ typings: { ...prev.typings, ...typings, ...specifics } }));
					};
				},
				setTaskLogs: (taskId: string, log: Log) => {
					set((prev) => {
						return {
							taskLogs: {
								...prev.taskLogs,
								[taskId]: [...(prev.taskLogs?.[taskId] ?? []), log],
							},
						};
					});
				},
				setEndpointLogs(epId, log) {
					set((prev) => {
						return {
							endpointLogs: {
								...prev.taskLogs,
								[epId]: [...(prev.endpointLogs?.[epId] ?? []), log],
							},
						};
					});
				},
				fetchTypes: async (packages) => {
					const typeWorker = getTypeWorker();
					const intersection = filterMatchingKeys(get().typings, packages);
					if (_.isEmpty(intersection)) return;
					typeWorker.postMessage(intersection);
					typeWorker.onmessage = async function (e) {
						const typings = e.data;
						set((prev) => ({ typings: { ...prev.typings, ...typings } }));
					};
				},
				toggleOpenEditorTab: () => {
					const version = useVersionStore.getState().version;
					set((prev) => {
						const isOpen = prev.sidebar?.[version._id]?.openEditor ?? false;
						return {
							sidebar: {
								...prev.sidebar,
								[version._id]: {
									...prev.sidebar?.[version._id],
									openEditor: !isOpen,
								},
							},
						};
					});
				},
				toggleSidebar: () => set((prev) => ({ isSidebarOpen: !prev.isSidebarOpen })),
				toggleWorkspaceTab: (tab) => {
					const version = useVersionStore.getState().version;
					set((prev) => {
						const openedTabs = prev.sidebar?.[version._id]?.openedTabs ?? [];
						const isOpen = openedTabs.includes(tab);
						return {
							sidebar: {
								...prev.sidebar,
								[version._id]: {
									...prev.sidebar?.[version._id],
									openedTabs: isOpen ? openedTabs.filter((t) => t !== tab) : [...openedTabs, tab],
								},
							},
						};
					});
				},
				collapseAll: () => {
					const version = useVersionStore.getState().version;
					set((prev) => {
						return {
							sidebar: {
								...prev.sidebar,
								[version._id]: {
									...prev.sidebar?.[version._id],
									openedTabs: [],
								},
							},
						};
					});
				},
				saveColumnState: (modelId, state) => {
					set((prev) => {
						return {
							columnState: {
								...prev.columnState,
								[modelId]: state,
							},
						};
					});
				},
				getColumnState: (modelId) => {
					return get().columnState[modelId];
				},
				resetColumnState: (modelId) => {
					set((prev) => {
						const state = prev.columnState;
						delete state[modelId];
						return { columnState: state };
					});
				},
				setColumnFilters: (columnName, filter, entityId) => {
					set((prev) => {
						return {
							columnFilters: {
								...prev.columnFilters,
								[entityId]: {
									...prev.columnFilters?.[entityId],
									[columnName]: filter,
								},
							},
						};
					});
				},
				clearAllColumnFilters: (entityId: string) => {
					set((prev) => {
						const state = prev.columnFilters;
						delete state?.[entityId];
						return { columnFilters: state };
					});
				},
				clearColumnFilter: (entityId, columnName) => {
					set((prev) => {
						const state = prev.columnFilters?.[entityId];
						delete state?.[columnName];
						return {
							columnFilters: {
								...prev.columnFilters,
								[entityId]: state,
							},
						};
					});
				},
				clearEndpointsRequestHeaders: () => {
					set({
						isAppliedToAllEndpoints: false,
					});
					set((prev) => {
						const state = prev.endpointRequest;
						Object.keys(state).forEach((key) => {
							state[key].headers?.map((h) => {
								if (h.key === 'Authorization' || h.key === 'Session') h.value = '';
								return h;
							});
						});
						return { endpointRequest: state };
					});
				},
				applyTokensToAllEndpoints: () => {
					const tokens = useEndpointStore.getState().tokens;
					const requests = get().endpointRequest;
					Object.keys(requests).forEach((key) => {
						const req = requests[key].headers?.map((h) => {
							if (h.key === 'Authorization') h.value = tokens.accessToken;
							if (h.key === 'Session') h.value = tokens.sessionToken;
							return h;
						});
						get().setEndpointRequest({
							...requests[key],
							headers: req,
						});
					});
				},
				clearLogColumnFilter: (type) => {
					set((prev) => {
						const state = prev.columnFilters;
						delete state?.[type];
						return {
							columnFilters: {
								...state,
								[type]: {
									timestamp: {
										conditions: [
											{
												filter: startOfDay(new Date()).toISOString(),
												type: ConditionsType.GreaterThanOrEqual,
											},
											{
												filter: endOfDay(new Date()).toISOString(),
												type: ConditionsType.LessThanOrEqual,
											},
										],
										filterType: Filters.Date,
									},
								},
							},
						};
					});
				},
				clearTokens: () => {
					useEndpointStore.getState().setTokens({ accessToken: '', sessionToken: '' });
					get().clearEndpointsRequestHeaders();
				},
			}),

			{ name: 'utils-store', storage: CustomStateStorage },
		),
	),
);

export default useUtilsStore;
