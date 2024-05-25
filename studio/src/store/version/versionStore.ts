import { VersionService } from '@/services';
import {
	APIError,
	BaseParams,
	CreateCopyOfVersionParams,
	Dashboard,
	DeleteVersionParams,
	DesignElement,
	GetVersionByIdParams,
	GetVersionLogBucketsParams,
	GetVersionLogsParams,
	GetVersionNotificationParams,
	GetVersionRequest,
	Notification,
	PushVersionParams,
	SearchCodeParams,
	SearchCodeResult,
	SearchDesignElementParams,
	UpdateVersionPropertiesParams,
	Version,
	VersionLog,
	VersionLogBucket,
} from '@/types';
import { history, joinChannel, resetAfterVersionChange } from '@/utils';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import useAuthStore from '../auth/authStore';
import useTabStore from './tabStore';
import useUtilsStore from './utilsStore';
interface VersionStore {
	loading: boolean;
	error: APIError;
	version: Version;
	versions: Version[];
	versionPage: number;
	createCopyVersionDrawerIsOpen: boolean;
	logBuckets: {
		endpoint: VersionLogBucket;
		task: VersionLogBucket;
		queue: VersionLogBucket;
	} | null;
	deleteVersionDrawerIsOpen: boolean;
	logs: {
		endpoint: VersionLog[] | null;
		task: VersionLog[] | null;
		queue: VersionLog[] | null;
	} | null;
	notifications: Notification[];
	notificationsPreview: Notification[];
	lastFetchedLogCount: number;
	log: VersionLog;
	showLogDetails: boolean;
	notificationLastSeen: Date;
	notificationLastFetchedCount: number | undefined;
	designElements: DesignElement[];
	dashboard: Dashboard;
	packages: Record<string, string>;
	lastFetchedLogPage:
		| {
				endpoint: number | undefined;
				task: number | undefined;
				queue: number | undefined;
		  }
		| undefined;
	isSearchCommandMenuOpen: boolean;
	isSearchViewOpen: boolean;
	searchCodeResult: SearchCodeResult[];
	openCodeResultIndexes: number[];
	matchCase: boolean;
	matchWholeWord: boolean;
	codeSearchTerm: string;
	isPushVersionDrawerOpen: boolean;
}

type Actions = {
	selectVersion: (version: Version) => void;
	getVersionById: (req: GetVersionByIdParams) => Promise<Version>;
	getAllVersionsVisibleToUser: (req: GetVersionRequest) => Promise<Version[]>;
	setVersionPage: (page: number) => void;
	updateVersionProperties: (params: UpdateVersionPropertiesParams) => Promise<Version>;
	createCopyOfVersion: (params: CreateCopyOfVersionParams) => Promise<Version>;
	getVersionDashboardPath: (appendPath?: string, version?: Version) => string;
	setCreateCopyVersionDrawerIsOpen: (isOpen: boolean) => void;
	getVersionLogs: (params: GetVersionLogsParams) => Promise<VersionLog[]>;
	getVersionLogBuckets: (params: GetVersionLogBucketsParams) => Promise<VersionLogBucket>;
	openVersionLogDetails: (log: VersionLog) => void;
	closeVersionLogDetails: () => void;
	deleteVersion: (params: DeleteVersionParams) => Promise<void>;
	getVersionNotifications: (params: GetVersionNotificationParams) => Promise<void>;
	getVersionNotificationsPreview: (params: GetVersionNotificationParams) => Promise<void>;
	updateNotificationLastSeen: () => void;
	searchDesignElements: (params: SearchDesignElementParams) => Promise<DesignElement[]>;
	resetDesignElements: () => void;
	getVersionDashboardInfo: (params: BaseParams) => Promise<Dashboard>;
	getNpmPackages: (params: BaseParams) => Promise<void>;
	getTypings: () => Promise<Record<string, string>>;
	toggleSearchCommandMenu: () => void;
	searchCode: (params: SearchCodeParams) => Promise<SearchCodeResult[]>;
	toggleSearchView: () => void;
	toggleCodeResult: (index: number) => void;
	setCodeSearchTerm: (input: string) => void;
	toggleMatchCase: () => void;
	toggleMatchWholeWord: () => void;
	togglePushVersionDrawer: () => void;
	pushVersion: (params: PushVersionParams) => Promise<void>;
	reset: () => void;
};

const initialState: VersionStore = {
	notificationLastFetchedCount: undefined,
	loading: false,
	error: {} as APIError,
	deleteVersionDrawerIsOpen: false,
	version: {} as Version,
	versions: [],
	versionPage: 0,
	createCopyVersionDrawerIsOpen: false,
	logBuckets: null,
	logs: null,
	notifications: [],
	notificationsPreview: [],
	log: {} as VersionLog,
	lastFetchedLogCount: 0,
	showLogDetails: false,
	notificationLastSeen: new Date(),
	designElements: [],
	dashboard: {} as Dashboard,
	packages: {},
	lastFetchedLogPage: undefined,
	isSearchCommandMenuOpen: false,
	isSearchViewOpen: false,
	searchCodeResult: [],
	openCodeResultIndexes: [],
	matchCase: false,
	matchWholeWord: false,
	codeSearchTerm: '',
	isPushVersionDrawerOpen: false,
};

const useVersionStore = create<VersionStore & Actions>()(
	devtools(
		persist(
			(set, get) => ({
				...initialState,
				selectVersion: (version: Version) => {
					if (version._id !== get().version._id) {
						resetAfterVersionChange();
						set({ version });
						get().getNpmPackages({
							orgId: version.orgId,
							appId: version.appId,
							versionId: version._id,
						});
					}

					history.navigate?.(get().getVersionDashboardPath(undefined, version));
				},
				setCreateCopyVersionDrawerIsOpen: (isOpen: boolean) => {
					set({ createCopyVersionDrawerIsOpen: isOpen });
				},
				getVersionById: async (params: GetVersionByIdParams) => {
					const version = await VersionService.getVersionById(params);
					set({ version });
					joinChannel(version._id);
					return version;
				},
				getAllVersionsVisibleToUser: async (req: GetVersionRequest) => {
					set({ loading: true });
					try {
						const versions = await VersionService.getAllVersionsVisibleToUser(req);
						if (!get().versionPage) set({ versions });
						else set((prev) => ({ versions: [...prev.versions, ...versions] }));
						return versions;
					} catch (error) {
						set({ error: error as APIError });
					} finally {
						set({ loading: false });
					}
				},
				setVersionPage: (page: number) => {
					set({ versionPage: page });
				},
				updateVersionProperties: async ({
					orgId,
					versionId,
					appId,
					onError,
					onSuccess,
					...data
				}: UpdateVersionPropertiesParams) => {
					try {
						const version = await VersionService.updateVersionProperties({
							orgId,
							versionId,
							appId,
							private: get().version?.private ?? false,
							defaultEndpointLimits: get().version?.defaultEndpointLimits ?? [],
							readOnly: get().version?.readOnly ?? false,
							name: get().version?.name ?? '',
							...data,
						});
						set({
							version: version,
						});
						onSuccess?.();
						return version;
					} catch (error) {
						onError?.(error as APIError);
						throw error;
					}
				},

				createCopyOfVersion: async (params: CreateCopyOfVersionParams) => {
					try {
						const { version } = await VersionService.createCopyOfVersion(params);
						set((prev) => ({ versions: [version, ...prev.versions] }));
						useUtilsStore.setState((prev) => ({
							sidebar: {
								...prev.sidebar,
								[version._id]: prev.sidebar[params.parentVersionId],
							},
						}));
						params.onSuccess?.(version);
						return version;
					} catch (e) {
						params.onError?.(e as APIError);
						throw e;
					}
				},

				getVersionDashboardPath: (path?: string, version?: Version) => {
					const _version = version ?? get().version;
					if (!_version) return '/organization';
					const { orgId, appId, _id } = _version;
					const urlPath = path ? `/${path.replace(/^\//, '')}` : '';
					if (path?.includes('organization')) return path;
					return `/organization/${orgId}/apps/${appId}/version/${_id}` + urlPath;
				},

				getVersionLogBuckets: async (params) => {
					try {
						const logBuckets = await VersionService.getVersionLogBuckets(params);
						set((state) => ({
							...state,
							logBuckets: {
								...state.logBuckets,
								[params.type]: logBuckets as VersionLogBucket,
							} as any,
						}));
						return logBuckets;
					} catch (error) {
						throw error as APIError;
					}
				},
				getVersionLogs: async (params) => {
					try {
						const logs = await VersionService.getVersionLogs(params);
						set({ lastFetchedLogCount: logs.length });
						if (params.page === 0) {
							set((state) => ({
								...state,
								logs: {
									...state.logs,
									[params.type]: logs,
								} as any,
								lastFetchedLogPage: {
									...state.lastFetchedLogPage,
									[params.type]: params.page,
								} as any,
							}));
						} else {
							set((state) => ({
								...state,
								logs: {
									...state.logs,
									[params.type]: [
										...((state.logs && state.logs[params.type]) as VersionLog[]),
										...logs,
									],
								} as any,
								lastFetchedLogPage: {
									...state.lastFetchedLogPage,
									[params.type]: params.page,
								} as any,
							}));
						}
						return logs;
					} catch (error) {
						throw error as APIError;
					}
				},
				openVersionLogDetails(log) {
					set({ log, showLogDetails: true });
				},
				closeVersionLogDetails() {
					set({ log: {} as VersionLog, showLogDetails: false });
				},
				deleteVersion: async (params) => {
					try {
						await VersionService.deleteVersion(params);
						set((prev) => ({
							versions: prev.versions.filter((v) => v._id !== params.versionId),
						}));
						useUtilsStore.setState((prev) => {
							const sidebar = { ...prev.sidebar };
							delete sidebar[params.versionId];
							return { sidebar, typings: {} };
						});

						useTabStore.setState((prev) => {
							const tabs = { ...prev.tabs };
							delete tabs[params.versionId];
							return { tabs };
						});

						params.onSuccess?.();
					} catch (e) {
						const error = e as APIError;
						params.onError?.(error);
						throw e;
					}
				},
				getVersionNotifications: async (params) => {
					try {
						const notifications = await VersionService.getVersionNotifications(params);
						if (params.page === 0) {
							set({ notifications, notificationLastFetchedCount: notifications.length });
						} else {
							set((prev) => ({
								notifications: [...prev.notifications, ...notifications],
								notificationLastFetchedCount: notifications.length,
							}));
						}
					} catch (error) {
						throw error as APIError;
					}
				},
				getVersionNotificationsPreview: async (params) => {
					try {
						const notifications = await VersionService.getVersionNotifications(params);
						const user = useAuthStore.getState().user;

						const allowedNotifications = user?.notifications.map((ntf) => {
							if (ntf === 'org') return ntf;
							if (ntf === 'app') return `org.${ntf}`;
							if (ntf === 'version') return `org.app.${ntf}`;
							return `org.app.version.${ntf}`;
						});
						const filteredNotifications = notifications.filter(
							(ntf) => allowedNotifications?.includes(ntf.object),
						);

						set({
							notificationsPreview: filteredNotifications,
						});
					} catch (error) {
						throw error as APIError;
					}
				},
				updateNotificationLastSeen: () => {
					set({ notificationLastSeen: new Date() });
				},
				searchDesignElements: async (params) => {
					try {
						const designElements = await VersionService.searchDesignElement(params);
						set({ designElements });
						return designElements;
					} catch (error) {
						throw error as APIError;
					}
				},
				resetDesignElements: () => {
					set({ designElements: [] });
				},
				getVersionDashboardInfo: async (params) => {
					try {
						const dashboard = await VersionService.getVersionsDashboardInfo(params);
						set({ dashboard });
						return dashboard;
					} catch (error) {
						throw error as APIError;
					}
				},
				getNpmPackages: async (params) => {
					try {
						const packages = await VersionService.getNpmPackages(params);
						set({ packages });
						useUtilsStore.getState().setTypings(packages);
					} catch (error) {
						throw error as APIError;
					}
				},
				getTypings: async () => {
					try {
						const typings = await VersionService.getVersionTypings({
							orgId: get().version.orgId,
							appId: get().version.appId,
							versionId: get().version._id,
						});
						return typings;
					} catch (error) {
						throw error as APIError;
					}
				},
				toggleSearchCommandMenu: () => {
					set((prev) => ({ isSearchCommandMenuOpen: !prev.isSearchCommandMenuOpen }));
				},
				toggleSearchView: () => set((prev) => ({ isSearchViewOpen: !prev.isSearchViewOpen })),
				searchCode: async (params) => {
					const searchCodeResult = await VersionService.searchCode(params);
					set({ searchCodeResult });
					return searchCodeResult;
				},
				toggleCodeResult: (index) => {
					set((prev) => {
						const openCodeResultIndexes = [...prev.openCodeResultIndexes];
						const indexInOpenCodeResultIndexes = openCodeResultIndexes.indexOf(index);
						if (indexInOpenCodeResultIndexes === -1) {
							openCodeResultIndexes.push(index);
						} else {
							openCodeResultIndexes.splice(indexInOpenCodeResultIndexes, 1);
						}
						return { openCodeResultIndexes };
					});
				},
				setCodeSearchTerm: (input) => set({ codeSearchTerm: input }),
				toggleMatchCase: () => set((prev) => ({ matchCase: !prev.matchCase })),
				toggleMatchWholeWord: () => set((prev) => ({ matchWholeWord: !prev.matchWholeWord })),
				togglePushVersionDrawer: () =>
					set((prev) => ({ isPushVersionDrawerOpen: !prev.isPushVersionDrawerOpen })),
				pushVersion: async (params) => {
					try {
						await VersionService.pushVersion(params);
						useUtilsStore.setState((prev) => {
							const sidebar = { ...prev.sidebar };
							delete sidebar[params.targetVersionId];
							return { sidebar, typings: {} };
						});

						useTabStore.setState((prev) => {
							const tabs = { ...prev.tabs };
							delete tabs[params.targetVersionId];
							return { tabs };
						});
					} catch (error) {
						throw error as APIError;
					}
				},
				reset: () => set(initialState),
			}),
			{
				name: 'version-store',
				partialize: (state) =>
					Object.fromEntries(Object.entries(state).filter(([key]) => ['version'].includes(key))),
			},
		),
	),
);

export default useVersionStore;
