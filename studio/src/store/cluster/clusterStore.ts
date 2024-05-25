import { AuthService, ClusterService, UserService } from '@/services';
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
	SetupCluster,
	TransferRequest,
	UpdateClusterComponentParams,
	UpdateRemainingClusterComponentsParams,
} from '@/types';
import { BaseGetRequest, BaseRequest, User, UserDataToRegister } from '@/types/type.ts';
import { sendMessageToChannel } from '@/utils';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import useAuthStore from '../auth/authStore';
import useEnvironmentStore from '../environment/environmentStore';
import useOrganizationStore from '../organization/organizationStore';

interface ClusterStore {
	loading: boolean;
	error: APIError | null;
	isCompleted: boolean;
	canClusterSendEmail: boolean;
	isCiCdEnabled: boolean;
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
	checkClusterSetup: (req?: BaseRequest) => Promise<boolean>;
	checkClusterSmtpStatus: () => Promise<boolean>;
	checkCICDStatus: () => Promise<boolean>;
	initializeClusterSetup: (data: UserDataToRegister) => Promise<User>;
	finalizeClusterSetup: (params: SetupCluster) => Promise<ClusterSetupResponse>;
	getClusterComponents: () => Promise<ClusterComponent[]>;
	updateClusterComponent: (data: UpdateClusterComponentParams) => Promise<void>;
	openEditClusterComponent: (editedClusterComponent: ClusterComponent) => void;
	closeEditClusterComponent: () => void;
	transferClusterOwnership: (params: TransferRequest) => Promise<void>;
	getClusterInfo: () => Promise<any>;
	updateSmtpSettings: (data: any) => Promise<any>;
	getClusterAndReleaseInfo: () => Promise<ClusterReleaseInfo>;
	updateClusterRelease: (param: { release: string }) => Promise<ClusterReleaseInfo>;
	toggleReleaseHistory: () => void;
	addDomain: (data: DomainParams) => Promise<Cluster>;
	deleteDomain: (data: DomainParams) => Promise<Cluster>;
	enforceSSL: (data: EnforceSSLAccessParams) => Promise<Cluster>;
	checkDomainStatus: () => Promise<void>;
	getActiveUsers: (params: BaseGetRequest) => Promise<User[]>;
	updateRemainingClusterComponents: (
		data: UpdateRemainingClusterComponentsParams,
	) => Promise<ClusterComponent>;
	enabledCICD: () => Promise<Cluster>;
	disabledCICD: () => Promise<Cluster>;
	reset: () => void;
};

const initialState: ClusterStore = {
	loading: false,
	isCompleted: false,
	canClusterSendEmail: false,
	isCiCdEnabled: false,
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
		checkClusterSetup: async (req) => {
			try {
				const { status } = await ClusterService.checkCompleted();
				set({ isCompleted: status });
				req?.onSuccess?.(status);
				return status;
			} catch (error) {
				set({ error: error as APIError });
				throw error;
			}
		},
		checkCICDStatus: async () => {
			try {
				const { status } = await ClusterService.checkCICDStatus();
				set({ isCiCdEnabled: status });
				return status;
			} catch (error) {
				set({ error: error as APIError });
				throw error;
			}
		},
		checkClusterSmtpStatus: async () => {
			try {
				const { status } = await ClusterService.canClusterSendEmail();
				set({ canClusterSendEmail: status });
				return status;
			} catch (error) {
				set({ error: error as APIError });
				throw error;
			}
		},
		initializeClusterSetup: async (data: UserDataToRegister) => {
			try {
				const user = await AuthService.initializeClusterSetup(data);
				if (data.onSuccess) data.onSuccess();
				useAuthStore.getState().setUser(user);
				return user;
			} catch (error) {
				set({ error: error as APIError });
				if (data.onError) data.onError(error as APIError);
				throw error;
			}
		},
		finalizeClusterSetup: async (params: SetupCluster) => {
			try {
				const clusterSetupResponse = await AuthService.finalizeClusterSetup(params);
				set({ isCompleted: true });
				const user = useAuthStore.getState().user;
				sendMessageToChannel('new_cluster', user);
				useOrganizationStore.setState({
					organization: {
						...clusterSetupResponse.org,
						role: 'Admin',
					},
				});
				useEnvironmentStore.setState({ environment: clusterSetupResponse.env });
				if (params.onSuccess) params.onSuccess(clusterSetupResponse);

				return clusterSetupResponse;
			} catch (error) {
				set({ error: error as APIError });
				if (params.onError) params.onError(error as APIError);
				throw error;
			}
		},
		getClusterComponents: async () => {
			try {
				const clusterComponents = await ClusterService.getClusterComponents();
				set({ clusterComponents });
				return clusterComponents;
			} catch (error) {
				set({ error: error as APIError });
				throw error;
			}
		},
		updateClusterComponent: async (data: UpdateClusterComponentParams) => {
			try {
				await ClusterService.updateClusterComponent(data);
				if (data.onSuccess) data.onSuccess();
			} catch (error) {
				if (data.onError) data.onError(error as APIError);
				throw error;
			}
		},
		updateRemainingClusterComponents: async (data: UpdateRemainingClusterComponentsParams) => {
			try {
				const clusterComponent = await ClusterService.updateRemainingClusterComponents(data);
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
							: item,
					),
				}));
				return clusterComponent;
			} catch (error) {
				set({ error: error as APIError });
				throw error;
			}
		},
		openEditClusterComponent: (editedClusterComponent) => {
			set({ isEditClusterComponentOpen: true, clusterComponent: editedClusterComponent });
		},
		closeEditClusterComponent: () => {
			set({ isEditClusterComponentOpen: false, clusterComponent: {} as ClusterComponent });
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
		updateSmtpSettings: async (data: any) => {
			try {
				const smtpSettings = await ClusterService.updateSmtpSettings(data);
				set({ canClusterSendEmail: true });
				return smtpSettings;
			} catch (error) {
				set({ error: error as APIError });
				throw error;
			}
		},
		getClusterAndReleaseInfo: async () => {
			const clusterReleaseInfo = await ClusterService.getClusterAndReleaseInfo();
			set({
				clusterReleaseInfo,
				clusterComponentsReleaseInfo: Object.entries(clusterReleaseInfo?.current?.modules ?? {})
					.filter(([module]) => module !== 'engine-core')
					.map(([module, version]) => ({
						module,
						version,
						status: clusterReleaseInfo?.cluster.clusterResourceStatus.find((item) =>
							item.name.includes(module),
						)?.status as string,
						latest: clusterReleaseInfo?.latest?.modules?.[module as keyof ModuleVersions] ?? '',
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
		reset: () => set(initialState),
	})),
);

export default useClusterStore;
