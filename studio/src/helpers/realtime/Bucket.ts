import useStorageStore from '@/store/storage/storageStore';
import useTabStore from '@/store/version/tabStore';
import useVersionStore from '@/store/version/versionStore';
import { Bucket as BucketType, RealtimeActionParams } from '@/types';
import { RealtimeActions } from './RealtimeActions';

class Bucket implements RealtimeActions<BucketType> {
	delete({ identifiers }: RealtimeActionParams<BucketType>): void {
		const { removeTabByPath } = useTabStore.getState();
		useStorageStore.setState?.((prev) => ({
			...prev,
			buckets: prev.buckets.filter((bucket) => bucket.id !== identifiers.bucketId),
		}));
		removeTabByPath(identifiers.versionId as string, identifiers.bucketName as string);
	}
	update({ data }: RealtimeActionParams<BucketType>): void {
		const { updateTab } = useTabStore.getState();
		const { version } = useVersionStore.getState();
		updateTab({
			versionId: version._id as string,
			tab: {
				title: data.name,
			},
			filter: (tab) => tab.path.includes(data._id as string),
		});
		useStorageStore.setState?.((prev) => ({
			...prev,
			buckets: prev.buckets.map((bucket) => {
				if (bucket.id === data.id) {
					return data;
				}
				return bucket;
			}),
			bucket: data,
		}));
	}
	create({ data }: RealtimeActionParams<BucketType>): void {
		useStorageStore.setState?.({
			buckets: [data, ...useStorageStore.getState().buckets],
		});
	}
	telemetry(param: RealtimeActionParams<BucketType>): void {
		this.update(param);
	}
}

export default Bucket;
