import useAuthStore from '@/store/auth/authStore';
import useDatabaseStore from '@/store/database/databaseStore';
import useModelStore from '@/store/database/modelStore';
import useEndpointStore from '@/store/endpoint/endpointStore';
import useFunctionStore from '@/store/function/functionStore';
import useMiddlewareStore from '@/store/middleware/middlewareStore';
import useMessageQueueStore from '@/store/queue/messageQueueStore';
import useStorageStore from '@/store/storage/storageStore';
import useTaskStore from '@/store/task/taskStore';
import useTabStore from '@/store/version/tabStore';
import { getVersionPermission } from '@/utils';
import _ from 'lodash';
import { LoaderFunctionArgs, redirect } from 'react-router-dom';

async function editEndpointLoader({ params }: LoaderFunctionArgs) {
	const { endpointId, orgId, versionId, appId } = params;
	if (!endpointId) return null;
	const { updateCurrentTab, closeDeleteTabModal } = useTabStore.getState();
	const { endpoint, getEndpointById, logics, setLogics, endpoints } = useEndpointStore.getState();

	const listEp = endpoints.find((ep) => ep._id === endpointId);
	if (!_.isEmpty(listEp) && listEp?.logic) {
		useEndpointStore.setState({ endpoint: listEp });
		if (_.isEmpty(logics[listEp._id])) {
			setLogics(listEp._id, listEp.logic);
		}
		return { endpoint: listEp };
	}

	if (endpoint?._id === endpointId) {
		updateCurrentTab(versionId as string, {
			isDirty: logics[endpointId] ? endpoint.logic !== logics[endpointId] : false,
		});
		setLogics(endpointId, logics[endpointId] ?? endpoint.logic);
		closeDeleteTabModal();
		return { endpoint };
	}

	await getEndpointById({
		orgId: orgId as string,
		appId: appId as string,
		versionId: versionId as string,
		epId: endpointId,
	});

	return { props: { endpoint } };
}
async function editFunctionLoader({ params }: LoaderFunctionArgs) {
	const { funcId, orgId, versionId, appId } = params as Record<string, string>;
	if (!funcId) return null;
	const {
		getFunctionById,
		logics,
		setLogics,
		function: helper,
		functions,
	} = useFunctionStore.getState();
	const { updateCurrentTab, closeDeleteTabModal } = useTabStore.getState();

	const listFn = functions.find((fn) => fn._id === funcId);
	if (!_.isEmpty(listFn) && listFn?.logic) {
		useFunctionStore.setState({ function: listFn });
		if (_.isEmpty(logics[listFn._id])) {
			setLogics(listFn._id, listFn.logic);
		}
		return { function: listFn };
	}

	if (helper?._id === funcId) {
		updateCurrentTab(versionId, {
			isDirty: logics[funcId] ? helper.logic !== logics[funcId] : false,
		});
		setLogics(funcId, logics[funcId] ?? helper.logic);
		closeDeleteTabModal();
		return { helper };
	}

	await getFunctionById({
		orgId: orgId,
		appId: appId,
		versionId: versionId,
		funcId: funcId,
	});

	return { props: {} };
}
async function editMiddlewareLoader({ params }: LoaderFunctionArgs) {
	const { middlewareId, orgId, appId, versionId } = params as Record<string, string>;
	const { updateCurrentTab, closeDeleteTabModal } = useTabStore.getState();
	const { middleware, logics, setLogics, middlewares } = useMiddlewareStore.getState();

	const listMw = middlewares.find((mw) => mw._id === middlewareId);
	if (!_.isEmpty(listMw) && listMw?.logic) {
		useMiddlewareStore.setState({ middleware: listMw });
		if (_.isEmpty(logics[listMw._id])) {
			setLogics(listMw._id, listMw.logic);
		}
		return { middleware: listMw };
	}

	if (middleware?._id === middlewareId) {
		updateCurrentTab(versionId, {
			isDirty: logics[middlewareId] ? middleware.logic !== logics[middlewareId] : false,
		});
		setLogics(middlewareId, logics[middlewareId] ?? middleware.logic);
		closeDeleteTabModal();
		return { middleware };
	}
	await useMiddlewareStore.getState().getMiddlewareById({
		orgId,
		appId,
		versionId,
		mwId: middlewareId,
	});
	return { props: {} };
}
async function editMessageQueueLoader({ params }: LoaderFunctionArgs) {
	const { queueId, orgId, versionId, appId } = params;
	if (!queueId) return null;
	const { updateCurrentTab, closeDeleteTabModal } = useTabStore.getState();
	const { queue, setLogics, getQueueById, logics, queues } = useMessageQueueStore.getState();
	const listQueue = queues.find((queue) => queue._id === queueId);
	if (!_.isEmpty(listQueue) && listQueue?.logic) {
		useMessageQueueStore.setState({ queue: listQueue });
		if (_.isEmpty(logics[listQueue._id])) {
			setLogics(listQueue._id, listQueue.logic);
		}
		return { queue: listQueue };
	}

	if (queue?._id === queueId) {
		updateCurrentTab(versionId as string, {
			isDirty: logics[queueId] ? queue.logic !== logics[queueId] : false,
		});
		setLogics(queueId, logics[queueId] ?? queue.logic);
		closeDeleteTabModal();
		return { queue };
	}

	await getQueueById({
		orgId: orgId as string,
		appId: appId as string,
		versionId: versionId as string,
		queueId: queueId,
	});

	return { props: {} };
}

async function bucketLoader({ params }: LoaderFunctionArgs) {
	const { removeTab, getCurrentTab } = useTabStore.getState();
	const { storageId, appId, orgId, versionId } = params;
	const { storages, storage } = useStorageStore.getState();
	let selectedStorage =
		storage._id === storageId ? storage : storages.find((storage) => storage._id === storageId);
	if (_.isEmpty(selectedStorage)) {
		selectedStorage = await useStorageStore.getState().getStorageById({
			storageId: storageId as string,
			appId: appId as string,
			orgId: orgId as string,
			versionId: versionId as string,
		});
	}
	useStorageStore.setState({ storage: selectedStorage });

	const permission = getVersionPermission('storage.viewData');

	if (!permission) {
		removeTab(versionId as string, getCurrentTab(versionId as string).id);
		return redirect('/401');
	}

	return { props: {} };
}

async function fileLoader({ params }: LoaderFunctionArgs) {
	const { bucketName, storageId, appId, orgId, versionId } = params;
	const { bucket, buckets, storage, getBucket, storages } = useStorageStore.getState();
	let selectedStorage = storages.find((storage) => storage._id === storageId);
	if (_.isEmpty(storage)) {
		if (!selectedStorage) {
			selectedStorage = await useStorageStore.getState().getStorageById({
				storageId: storageId as string,
				appId: appId as string,
				orgId: orgId as string,
				versionId: versionId as string,
			});
		}
		useStorageStore.setState({ storage: selectedStorage });
	}

	if (bucketName !== bucket?.name) {
		let selectedBucket = buckets.find((bucket) => bucket.name === bucketName);
		if (!selectedBucket) {
			selectedBucket = await getBucket({
				storageName: selectedStorage?.name ?? storage.name,
				bucketName: bucketName as string,
			});
		}
		useStorageStore.setState({ bucket: selectedBucket });
	}
	return { props: {} };
}
async function editTaskLoader({ params }: LoaderFunctionArgs) {
	const { taskId, orgId, versionId, appId } = params;
	if (!taskId) return null;
	const { updateCurrentTab, closeDeleteTabModal } = useTabStore.getState();
	const { task, getTask, logics, setLogics, tasks } = useTaskStore.getState();

	const listTask = tasks.find((task) => task._id === taskId);
	if (!_.isEmpty(listTask) && listTask?.logic) {
		useTaskStore.setState({ task: listTask });
		if (_.isEmpty(logics[listTask._id])) {
			setLogics(listTask._id, listTask.logic);
		}
		return { task: listTask };
	}

	if (task?._id === taskId) {
		updateCurrentTab(versionId as string, {
			isDirty: logics[taskId] ? task.logic !== logics[taskId] : false,
		});
		setLogics(taskId, logics[taskId] ?? task.logic);
		closeDeleteTabModal();
		return { task };
	}

	await getTask({
		orgId: orgId as string,
		appId: appId as string,
		versionId: versionId as string,
		taskId,
	});

	return { props: {} };
}

async function modelsOutletLoader({ params }: LoaderFunctionArgs) {
	if (!useAuthStore.getState().isAuthenticated()) return null;

	const apiParams = params as {
		orgId: string;
		appId: string;
		versionId: string;
		dbId: string;
	};
	const { database, getDatabaseOfAppById, databases } = useDatabaseStore.getState();
	const listDb = databases.find((db) => db._id === apiParams.dbId);
	if (!_.isEmpty(listDb)) {
		useDatabaseStore.setState({ database: listDb });
		return { database: listDb };
	}
	if (database._id !== apiParams.dbId) await getDatabaseOfAppById(apiParams);

	return { props: {} };
}

async function fieldsLoader({ params }: LoaderFunctionArgs) {
	if (!useAuthStore.getState().isAuthenticated()) return null;

	const apiParams = params as {
		orgId: string;
		appId: string;
		versionId: string;
		dbId: string;
		modelId: string;
	};

	const { getSpecificModelOfDatabase, model } = useModelStore.getState();
	if (apiParams.modelId !== model?._id && apiParams.modelId)
		await getSpecificModelOfDatabase(apiParams);

	return { props: {} };
}

async function navigatorLoader({ params }: LoaderFunctionArgs) {
	if (!useAuthStore.getState().isAuthenticated()) return null;

	const { getModels, setModel, getModelsOfSelectedDb, model } = useModelStore.getState();
	const { database, getDatabaseOfAppById, databases } = useDatabaseStore.getState();

	const apiParams = params as {
		orgId: string;
		appId: string;
		versionId: string;
		dbId: string;
		modelId: string;
	};
	if (database._id !== apiParams.dbId) {
		const listDb = databases.find((db) => db._id === apiParams.dbId);
		if (!_.isEmpty(listDb)) {
			useDatabaseStore.setState({ database: listDb });
		} else await getDatabaseOfAppById(apiParams);
	}

	const models = getModelsOfSelectedDb(apiParams.dbId);
	if (_.isEmpty(models)) {
		const models = await getModels(apiParams);
		setModel(models.find((m) => m._id === apiParams.modelId) ?? models[0]);
	}

	if (models) {
		if (apiParams.modelId && apiParams.modelId !== model?._id && !_.isEmpty(models)) {
			const selectedModel = models.find((m) => m._id === apiParams.modelId);

			if (selectedModel) setModel(selectedModel);
			else setModel(models[0]);
		}
	}

	return { props: {} };
}

export default {
	editEndpointLoader,
	editFunctionLoader,
	editMiddlewareLoader,
	editMessageQueueLoader,
	bucketLoader,
	fileLoader,
	editTaskLoader,
	modelsOutletLoader,
	fieldsLoader,
	navigatorLoader,
};
