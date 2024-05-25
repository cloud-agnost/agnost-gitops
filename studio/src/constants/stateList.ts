import useAuthStore from '@/store/auth/authStore';
import useCacheStore from '@/store/cache/cacheStore';
import useClusterStore from '@/store/cluster/clusterStore';
import useDatabaseStore from '@/store/database/databaseStore';
import useModelStore from '@/store/database/modelStore';
import useNavigatorStore from '@/store/database/navigatorStore';
import useEndpointStore from '@/store/endpoint/endpointStore';
import useEnvironmentStore from '@/store/environment/environmentStore';
import useFunctionStore from '@/store/function/functionStore';
import useMiddlewareStore from '@/store/middleware/middlewareStore';
import useOnboardingStore from '@/store/onboarding/onboardingStore';
import useOrganizationStore from '@/store/organization/organizationStore';
import useMessageQueueStore from '@/store/queue/messageQueueStore';
import useResourceStore from '@/store/resources/resourceStore';
import useStorageStore from '@/store/storage/storageStore';
import useTaskStore from '@/store/task/taskStore';
import useThemeStore from '@/store/theme/themeStore';
import useTypeStore from '@/store/types/typeStore';
import useSettingsStore from '@/store/version/settingsStore';
import useTabStore from '@/store/version/tabStore';
import useVersionStore from '@/store/version/versionStore';
import { StoreApi, UseBoundStore } from 'zustand';
export const STATE_LIST: Record<string, UseBoundStore<StoreApi<any>>> = {
	auth: useAuthStore,
	cache: useCacheStore,
	cluster: useClusterStore,
	database: useDatabaseStore,
	model: useModelStore,
	navigator: useNavigatorStore,
	endpoint: useEndpointStore,
	environment: useEnvironmentStore,
	function: useFunctionStore,
	middleware: useMiddlewareStore,
	onBoarding: useOnboardingStore,
	organization: useOrganizationStore,
	queue: useMessageQueueStore,
	resource: useResourceStore,
	storage: useStorageStore,
	task: useTaskStore,
	theme: useThemeStore,
	types: useTypeStore,
	settings: useSettingsStore,
	tab: useTabStore,
	version: useVersionStore,
};
