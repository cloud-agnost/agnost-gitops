import { VersionService } from '@/services';
import {
	APIError,
	APIKey,
	AddCustomDomainParams,
	AddNPMPackageParams,
	AddVersionVariableParams,
	AuthMessageTemplateParams,
	CreateAPIKeyParams,
	CreateOAuthConfigParams,
	CreateRateLimitParams,
	CustomDomain,
	DeleteAPIKeyParams,
	DeleteCustomDomainParams,
	DeleteMultipleAPIKeys,
	DeleteMultipleCustomDomainsParams,
	DeleteMultipleNPMPackagesParams,
	DeleteMultipleRateLimitsParams,
	DeleteMultipleVersionVariablesParams,
	DeleteNPMPackageParams,
	DeleteOAuthConfigParams,
	DeleteRateLimitParams,
	DeleteVersionVariableParams,
	EditRateLimitParams,
	GetCustomDomainParams,
	Param,
	RateLimit,
	SaveEmailAuthParams,
	SaveEmailPhoneParams,
	SaveRedirectURLsParams,
	SaveUserDataModelInfoParams,
	SearchNPMPackages,
	SearchNPMPackagesParams,
	UpdateAPIKeyParams,
	UpdateOAuthConfigParams,
	UpdateVersionRealtimePropertiesParams,
	UpdateVersionVariableParams,
	Version,
} from '@/types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import useUtilsStore from './utilsStore';
import useVersionStore from './versionStore';

interface SettingsStore {
	param: Param;
	rateLimit: RateLimit;
	editParamDrawerIsOpen: boolean;
	editRateLimitDrawerIsOpen: boolean;
	editAPIKeyDrawerIsOpen: boolean;
	selectedAPIKey: APIKey;
	versionDomains: CustomDomain[];
	lastFetchedDomainPage: number | undefined;
}

type Actions = {
	searchNPMPackages: (params: SearchNPMPackagesParams) => Promise<SearchNPMPackages[]>;
	addNPMPackage: (params: AddNPMPackageParams) => Promise<Version>;
	deleteNPMPackage: (params: DeleteNPMPackageParams) => Promise<Version>;
	deleteMultipleNPMPackages: (params: DeleteMultipleNPMPackagesParams) => Promise<Version>;
	setParam: (param: Param) => void;
	addParam: (params: AddVersionVariableParams) => Promise<Version>;
	deleteParam: (params: DeleteVersionVariableParams) => Promise<Version>;
	deleteMultipleParams: (params: DeleteMultipleVersionVariablesParams) => Promise<Version>;
	updateParam: (params: UpdateVersionVariableParams) => Promise<Version>;
	setEditParamDrawerIsOpen: (isOpen: boolean) => void;
	setEditRateLimitDrawerIsOpen: (isOpen: boolean) => void;
	setRateLimit: (rateLimit: RateLimit) => void;
	editRateLimit: (params: EditRateLimitParams) => Promise<Version>;
	deleteMultipleRateLimits: (params: DeleteMultipleRateLimitsParams) => Promise<Version>;
	createAPIKey: (params: CreateAPIKeyParams) => Promise<Version>;
	editAPIKey: (params: UpdateAPIKeyParams) => Promise<Version>;
	deleteAPIKey: (params: DeleteAPIKeyParams) => Promise<Version>;
	deleteMultipleAPIKeys: (params: DeleteMultipleAPIKeys) => Promise<Version>;
	updateVersionRealtimeProperties: (
		params: UpdateVersionRealtimePropertiesParams,
	) => Promise<Version>;
	saveUserDataModelInfo: (params: SaveUserDataModelInfoParams) => Promise<void>;
	addMissingUserDataModelFields: (params: SaveUserDataModelInfoParams) => Promise<void>;
	saveRedirectURLs: (params: SaveRedirectURLsParams) => Promise<void>;
	saveEmailAuthSettings: (params: SaveEmailAuthParams) => Promise<void>;
	savePhoneAuthSettings: (params: SaveEmailPhoneParams) => Promise<void>;
	createOAuthConfig: (params: CreateOAuthConfigParams) => Promise<void>;
	updateOAuthConfig: (params: UpdateOAuthConfigParams) => Promise<void>;
	deleteOAuthConfig: (params: DeleteOAuthConfigParams) => Promise<void>;
	setAuthMessageTemplate: (params: AuthMessageTemplateParams) => Promise<void>;
	setSelectedAPIKey: (key: APIKey) => void;
	setEditAPIKeyDrawerIsOpen: (isOpen: boolean) => void;
	createRateLimit: (params: CreateRateLimitParams) => Promise<RateLimit>;
	deleteRateLimit: (params: DeleteRateLimitParams) => Promise<Version>;
	orderEndpointRateLimits: (limits: string[]) => void;
	orderRealtimeRateLimits: (limits: string[]) => void;
	getCustomDomainsOfVersion: (params: GetCustomDomainParams) => Promise<CustomDomain[]>;
	addCustomDomain: (params: AddCustomDomainParams) => Promise<CustomDomain>;
	deleteCustomDomain: (params: DeleteCustomDomainParams) => Promise<void>;
	deleteMultipleCustomDomains: (params: DeleteMultipleCustomDomainsParams) => Promise<void>;
	reset: () => void;
};

const initialState: SettingsStore = {
	param: {} as Param,
	rateLimit: {} as RateLimit,
	editParamDrawerIsOpen: false,
	editRateLimitDrawerIsOpen: false,
	editAPIKeyDrawerIsOpen: false,
	selectedAPIKey: {} as APIKey,
	versionDomains: [],
	lastFetchedDomainPage: undefined,
};

const useSettingsStore = create<SettingsStore & Actions>()(
	devtools((set) => ({
		...initialState,
		searchNPMPackages: async (params: SearchNPMPackagesParams) => {
			try {
				return VersionService.searchNPMPackages(params);
			} catch (e) {
				throw e;
			}
		},
		addNPMPackage: async (params: AddNPMPackageParams) => {
			try {
				const version = await VersionService.addNPMPackage(params);
				useUtilsStore.getState().fetchTypes({
					[params.name]: params.version,
				});
				useVersionStore.setState((prev) => ({
					version,
					packages: {
						...prev.packages,
						[params.name]: params.version,
					},
				}));

				return version;
			} catch (e) {
				throw e;
			}
		},
		deleteNPMPackage: async (params: DeleteNPMPackageParams) => {
			try {
				const version = await VersionService.deleteNPMPackage(params);

				useVersionStore.setState({
					version,
				});

				return version;
			} catch (e) {
				throw e;
			}
		},
		deleteMultipleNPMPackages: async (params: DeleteMultipleNPMPackagesParams) => {
			try {
				const version = await VersionService.deleteMultipleNPMPackages(params);
				useVersionStore.setState({ version });

				return version;
			} catch (e) {
				throw e;
			}
		},
		setParam: (param: Param) => {
			set({ param });
		},
		addParam: async (params: AddVersionVariableParams) => {
			try {
				const version = await VersionService.addVersionVariable(params);
				useVersionStore.setState({ version });

				return version;
			} catch (e) {
				throw e;
			}
		},
		deleteParam: async (params: DeleteVersionVariableParams) => {
			try {
				const version = await VersionService.deleteVersionVariable(params);
				useVersionStore.setState({ version });

				return version;
			} catch (e) {
				throw e;
			}
		},
		deleteMultipleParams: async (params: DeleteMultipleVersionVariablesParams) => {
			try {
				const version = await VersionService.deleteMultipleVersionVariables(params);
				useVersionStore.setState({ version });

				return version;
			} catch (e) {
				throw e;
			}
		},
		updateParam: async (params: UpdateVersionVariableParams) => {
			try {
				const version = await VersionService.updateVersionVariable(params);
				useVersionStore.setState({ version });

				return version;
			} catch (e) {
				throw e;
			}
		},
		setEditParamDrawerIsOpen: (isOpen: boolean) => {
			set({ editParamDrawerIsOpen: isOpen });
		},
		setEditRateLimitDrawerIsOpen: (isOpen: boolean) => {
			set({ editRateLimitDrawerIsOpen: isOpen });
		},
		setRateLimit: (rateLimit) => {
			set({ rateLimit });
		},
		editRateLimit: async (params: EditRateLimitParams) => {
			try {
				const version = await VersionService.editRateLimit(params);
				useVersionStore.setState({ version });

				return version;
			} catch (e) {
				throw e;
			}
		},
		deleteMultipleRateLimits: async (params: DeleteMultipleRateLimitsParams) => {
			try {
				const version = await VersionService.deleteMultipleRateLimits(params);
				useVersionStore.setState({ version });

				return version;
			} catch (e) {
				throw e;
			}
		},
		createAPIKey: async (params) => {
			try {
				const version = await VersionService.createAPIKey(params);
				useVersionStore.setState({ version });

				return version;
			} catch (e) {
				throw e;
			}
		},
		deleteAPIKey: async (params) => {
			try {
				const version = await VersionService.deleteAPIKey(params);
				useVersionStore.setState({ version });

				return version;
			} catch (e) {
				throw e;
			}
		},
		editAPIKey: async (params) => {
			try {
				const version = await VersionService.editAPIKey(params);
				useVersionStore.setState({ version });

				return version;
			} catch (e) {
				throw e;
			}
		},
		deleteMultipleAPIKeys: async (params) => {
			try {
				const version = await VersionService.deleteMultipleAPIKeys(params);
				useVersionStore.setState({ version });

				return version;
			} catch (e) {
				throw e;
			}
		},
		updateVersionRealtimeProperties: async (params) => {
			try {
				const version = useVersionStore.getState().version;
				const updatedVersion = await VersionService.updateVersionRealtimeProperties(params);
				useVersionStore.setState({ version: updatedVersion });
				return version;
			} catch (error) {
				throw error as APIError;
			}
		},
		saveUserDataModelInfo: async (params) => {
			try {
				const version = await VersionService.saveUserDataModelInfo(params);
				useVersionStore.setState({ version });
			} catch (error) {
				throw error as APIError;
			}
		},
		addMissingUserDataModelFields: async (params) => {
			try {
				await VersionService.addMissingUserDataModelFields(params);
			} catch (error) {
				throw error as APIError;
			}
		},
		saveRedirectURLs: async (params) => {
			try {
				const version = await VersionService.saveRedirectURLs(params);
				useVersionStore.setState({ version });
			} catch (error) {
				throw error as APIError;
			}
		},
		saveEmailAuthSettings: async (params) => {
			try {
				const version = await VersionService.saveEmailAuthSettings(params);
				useVersionStore.setState({ version });
			} catch (error) {
				throw error as APIError;
			}
		},
		savePhoneAuthSettings: async (params) => {
			try {
				const version = await VersionService.savePhoneAuthSettings(params);
				useVersionStore.setState({ version });
			} catch (error) {
				throw error as APIError;
			}
		},
		createOAuthConfig: async (params) => {
			try {
				const version = await VersionService.createOAuthConfig(params);
				useVersionStore.setState({ version });
			} catch (error) {
				throw error as APIError;
			}
		},
		updateOAuthConfig: async (params) => {
			try {
				await VersionService.updateOAuthConfig(params);
			} catch (error) {
				throw error as APIError;
			}
		},
		deleteOAuthConfig: async (params) => {
			try {
				await VersionService.deleteOAuthConfig(params);
				useVersionStore.setState((prev) => ({
					version: {
						...prev.version,
						authentication: {
							...prev.version.authentication,
							providers: prev.version.authentication.providers.filter(
								(p) => p._id !== params.providerId,
							),
						},
					},
				}));
			} catch (error) {
				throw error as APIError;
			}
		},
		setAuthMessageTemplate: async (params) => {
			try {
				const version = await VersionService.setAuthMessageTemplate(params);
				useVersionStore.setState({ version });
			} catch (error) {
				throw error as APIError;
			}
		},
		setSelectedAPIKey: (key: APIKey) => {
			set({ selectedAPIKey: key });
		},
		setEditAPIKeyDrawerIsOpen: (isOpen: boolean) => {
			set({ editAPIKeyDrawerIsOpen: isOpen });
		},
		createRateLimit: async (params: CreateRateLimitParams) => {
			const version = await VersionService.createRateLimit(params);
			useVersionStore.setState({ version });
			return version.limits.at(-1);
		},
		deleteRateLimit: async (params: DeleteRateLimitParams) => {
			try {
				const version = await VersionService.deleteRateLimit(params);
				useVersionStore.setState({ version });
				return version;
			} catch (e) {
				throw e;
			}
		},
		orderEndpointRateLimits: (limits: string[]) => {
			useVersionStore.setState((prev) => {
				if (!prev.version) return prev;
				prev.version.defaultEndpointLimits = limits;
				return {
					version: prev.version,
				};
			});
		},
		orderRealtimeRateLimits: (limits: string[]) => {
			useVersionStore.setState((prev) => ({
				version: {
					...prev.version,
					realtime: {
						...prev.version.realtime,
						defaultLimits: limits,
					},
				},
			}));
		},
		getCustomDomainsOfVersion: async (params) => {
			try {
				const domains = await VersionService.getCustomDomainsOfAppVersion(params);
				if (params.page === 0) {
					set({ versionDomains: domains, lastFetchedDomainPage: params.page });
				} else {
					set((prev) => ({
						versionDomains: [...prev.versionDomains, ...domains],
						lastFetchedDomainPage: params.page,
					}));
				}
				return domains;
			} catch (error) {
				throw error as APIError;
			}
		},
		addCustomDomain: async (params) => {
			try {
				const domain = await VersionService.addCustomDomain(params);
				set((prev) => ({ versionDomains: [...prev.versionDomains, domain] }));
				return domain;
			} catch (error) {
				throw error as APIError;
			}
		},
		deleteCustomDomain: async (params) => {
			try {
				await VersionService.deleteCustomDomain(params);
				set((prev) => ({
					versionDomains: prev.versionDomains.filter((domain) => domain._id !== params.domainId),
				}));
			} catch (error) {
				throw error as APIError;
			}
		},
		deleteMultipleCustomDomains: async (params) => {
			try {
				await VersionService.deleteMultipleCustomDomains(params);
				set((prev) => ({
					versionDomains: prev.versionDomains.filter(
						(domain) => !params.domainIds.includes(domain._id),
					),
				}));
			} catch (error) {
				throw error as APIError;
			}
		},

		reset: () => set(initialState),
	})),
);

export default useSettingsStore;
