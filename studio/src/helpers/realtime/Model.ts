import useModelStore from '@/store/database/modelStore';
import useTabStore from '@/store/version/tabStore';
import { Model as ModelType, RealtimeActionParams } from '@/types';
import { RealtimeActions } from './RealtimeActions';

class Model implements RealtimeActions<ModelType> {
	delete({ identifiers }: RealtimeActionParams<ModelType>): void {
		const { removeTabByPath } = useTabStore.getState();
		useModelStore.setState?.((state) => ({
			models: {
				...state.models,
				[identifiers.dbId as string]: state.models[identifiers.dbId as string].filter(
					(m) => m._id !== identifiers.modelId,
				),
			},
		}));

		removeTabByPath(identifiers.versionId as string, identifiers.modelId as string);
	}
	update({ data }: RealtimeActionParams<ModelType>): void {
		const { updateTab } = useTabStore.getState();
		updateTab({
			versionId: data.versionId,
			tab: {
				title: data.name,
			},
			filter: (tab) => tab.path.includes(data._id),
		});
		useModelStore.setState?.((state) => ({
			models: {
				...state.models,
				[data.dbId]: state.models[data.dbId]?.map((model) =>
					model._id === data._id ? data : model,
				),
			},
			model: data,
		}));
	}
	create({ data }: RealtimeActionParams<ModelType>): void {
		useModelStore.setState?.((state) => ({
			models: {
				...state.models,
				[data.dbId]: [data, ...state.models[data.dbId]],
			},
			model: data,
		}));
	}
	telemetry(param: RealtimeActionParams<ModelType>): void {
		this.update(param);
	}
}

export default Model;
