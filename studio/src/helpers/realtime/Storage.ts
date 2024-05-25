import useStorageStore from '@/store/storage/storageStore';
import useTabStore from '@/store/version/tabStore';
import useVersionStore from '@/store/version/versionStore';
import { RealtimeActionParams, Storage as StorageType } from '@/types';
import { RealtimeActions } from './RealtimeActions';

class Storage implements RealtimeActions<StorageType> {
	delete({ identifiers }: RealtimeActionParams<StorageType>): void {
		const { removeTabByPath } = useTabStore.getState();
		useStorageStore.setState?.((state) => ({
			storages: state.storages.filter((storage) => storage._id !== identifiers.storageId),
			workspaceStorages: state.workspaceStorages.filter(
				(storage) => storage._id !== identifiers.storageId,
			),
		}));
		removeTabByPath(identifiers.versionId as string, identifiers.storageId as string);
		useVersionStore.setState?.((state) => ({
			dashboard: {
				...state.dashboard,
				storage: state.dashboard.storage - 1,
			},
		}));
	}
	update({ data }: RealtimeActionParams<StorageType>): void {
		const { updateTab } = useTabStore.getState();
		updateTab({
			versionId: data.versionId,
			tab: {
				title: data.name,
			},
			filter: (tab) => tab.path.includes(data._id),
		});
		useStorageStore.setState?.((state) => ({
			storages: state.storages.map((storage) => (storage._id === data._id ? data : storage)),
			workspaceStorages: state.workspaceStorages.map((storage) =>
				storage._id === data._id ? data : storage,
			),
			storage: data._id === state.storage._id ? data : state.storage,
		}));
	}
	create({ data }: RealtimeActionParams<StorageType>): void {
		useStorageStore.setState?.((state) => ({
			storages: [data, ...state.storages],
			workspaceStorages: [data, ...state.workspaceStorages],
		}));
		useVersionStore.setState?.((state) => ({
			dashboard: {
				...state.dashboard,
				storage: state.dashboard.storage + 1,
			},
		}));
	}
	telemetry(param: RealtimeActionParams<StorageType>): void {
		this.update(param);
	}
}

export default Storage;
