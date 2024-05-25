import useCacheStore from '@/store/cache/cacheStore';
import useTabStore from '@/store/version/tabStore';
import useVersionStore from '@/store/version/versionStore';
import { Cache as CacheType, RealtimeActionParams } from '@/types';
import { RealtimeActions } from './RealtimeActions';
class Cache implements RealtimeActions<CacheType> {
	delete({ identifiers }: RealtimeActionParams<CacheType>): void {
		const { removeTabByPath } = useTabStore.getState();
		useCacheStore.setState?.((state) => ({
			caches: state.caches.filter((cache) => cache._id !== identifiers.cacheId),
			workspaceCaches: state.workspaceCaches.filter((cache) => cache._id !== identifiers.cacheId),
		}));
		removeTabByPath(identifiers.versionId as string, identifiers.cacheId as string);
		useVersionStore.setState?.((state) => ({
			dashboard: {
				...state.dashboard,
				cache: state.dashboard.cache - 1,
			},
		}));
	}
	update({ data }: RealtimeActionParams<CacheType>): void {
		const { updateTab } = useTabStore.getState();
		useCacheStore.setState?.((state) => ({
			caches: state.caches.map((cache) => (cache._id === data._id ? data : cache)),
			workspaceCaches: state.workspaceCaches.map((cache) =>
				cache._id === data._id ? data : cache,
			),
			cache: data._id === state.cache._id ? data : state.cache,
		}));
		updateTab({
			versionId: data.versionId,
			tab: {
				title: data.name,
			},
			filter: (tab) => tab.path.includes(data._id),
		});
	}
	create({ data }: RealtimeActionParams<CacheType>): void {
		useCacheStore.setState?.((state) => ({
			caches: [data, ...state.caches],
			workspaceCaches: [data, ...state.workspaceCaches],
		}));
		useVersionStore.setState?.((state) => ({
			dashboard: {
				...state.dashboard,
				cache: state.dashboard.cache + 1,
			},
		}));
	}
	telemetry(param: RealtimeActionParams<CacheType>): void {
		this.update(param);
	}
}
export default Cache;
