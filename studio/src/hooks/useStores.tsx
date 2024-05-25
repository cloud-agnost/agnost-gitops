import useCacheStore from '@/store/cache/cacheStore';
import useDatabaseStore from '@/store/database/databaseStore';
import useModelStore from '@/store/database/modelStore';
import useEndpointStore from '@/store/endpoint/endpointStore';
import useFunctionStore from '@/store/function/functionStore';
import useMiddlewareStore from '@/store/middleware/middlewareStore';
import useMessageQueueStore from '@/store/queue/messageQueueStore';
import useStorageStore from '@/store/storage/storageStore';
import useTaskStore from '@/store/task/taskStore';
import { TabTypes } from '@/types';

export default function useStores() {
	const { workspaceCaches } = useCacheStore();
	const { workspaceTasks } = useTaskStore();
	const { workspaceDatabases } = useDatabaseStore();
	const { workSpaceEndpoints } = useEndpointStore();
	const { workspaceFunctions } = useFunctionStore();
	const { workspaceQueues } = useMessageQueueStore();
	const { workspaceMiddlewares } = useMiddlewareStore();
	const { workspaceStorages } = useStorageStore();
	const { workspaceModels } = useModelStore();
	const STORES: Record<string, any> = {
		[TabTypes.Cache]: useCacheStore(),
		[TabTypes.Task]: useTaskStore(),
		[TabTypes.Database]: useDatabaseStore(),
		[TabTypes.Endpoint]: useEndpointStore(),
		[TabTypes.Function]: useFunctionStore(),
		[TabTypes.MessageQueue]: useMessageQueueStore(),
		[TabTypes.Middleware]: useMiddlewareStore(),
		[TabTypes.Storage]: useStorageStore(),
		[TabTypes.Model]: useModelStore(),
	};

	const data: Record<string, any> = {
		[TabTypes.Cache]: structuredClone(workspaceCaches),
		[TabTypes.Task]: structuredClone(workspaceTasks),
		[TabTypes.Database]: structuredClone(workspaceDatabases),
		[TabTypes.Endpoint]: structuredClone(workSpaceEndpoints),
		[TabTypes.Function]: structuredClone(workspaceFunctions),
		[TabTypes.MessageQueue]: structuredClone(workspaceQueues),
		[TabTypes.Middleware]: structuredClone(workspaceMiddlewares),
		[TabTypes.Storage]: structuredClone(workspaceStorages),
		[TabTypes.Model]: structuredClone(workspaceModels),
	};

	function getFunction(type: TabTypes, name: string) {
		return STORES[type]?.[name];
	}
	return { getFunction, data, STORES };
}
