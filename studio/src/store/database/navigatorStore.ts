import { NavigatorService } from '@/services';
import {
	APIError,
	BucketCountInfo,
	DeleteDataFromModelParams,
	DeleteMultipleDataFromModelParams,
	GetDataFromModelParams,
	UpdateDataFromModelParams,
} from '@/types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import useModelStore from './modelStore';
interface NavigatorStore {
	data: {
		[modelId: string]: Record<string, any>[];
	};
	subModelData: Record<string, any>[];
	selectedSubModelId: string;
	dataCountInfo:
		| {
				[id: string]: BucketCountInfo | undefined;
		  }
		| undefined;
}

type Actions = {
	getDataFromModel: (params: GetDataFromModelParams) => Promise<any[]>;
	deleteDataFromModel: (param: DeleteDataFromModelParams) => Promise<void>;
	deleteMultipleDataFromModel: (param: DeleteMultipleDataFromModelParams) => Promise<void>;
	updateDataFromModel: (param: UpdateDataFromModelParams) => Promise<void>;
	getDataOfSelectedModel: (modelId: string) => Record<string, any>[] | undefined;
	reset: () => void;
};

const initialState: NavigatorStore = {
	data: {},
	subModelData: [],
	selectedSubModelId: '',
	dataCountInfo: undefined,
};

const useNavigatorStore = create<NavigatorStore & Actions>()(
	devtools((set, get) => ({
		...initialState,
		getDataFromModel: async (params) => {
			try {
				const { data, countInfo } = await NavigatorService.getDataFromModel(params);
				const modelId = useModelStore.getState().model._id;

				set((state) => ({
					data: {
						...state.data,
						[modelId]: data,
					},
					dataCountInfo: {
						...state.dataCountInfo,
						[modelId]: countInfo,
					},
				}));

				return data;
			} catch (error) {
				throw error as APIError;
			}
		},
		deleteDataFromModel: async (param) => {
			try {
				await NavigatorService.deleteDataFromModel(param);
				const modelId = useModelStore.getState().model._id;
				set((state) => ({
					data: {
						...state.data,
						[modelId]: state.data[modelId].filter((item) => item.id !== param.id),
					},
				}));
				if (param.onSuccess) param.onSuccess();
			} catch (error) {
				if (param.onError) param.onError(error as APIError);
				throw error;
			}
		},
		deleteMultipleDataFromModel: async (param) => {
			try {
				await NavigatorService.deleteMultipleDataFromModel(param);
				const modelId = useModelStore.getState().model._id;
				set((state) => ({
					data: {
						...state.data,
						[modelId]: state.data[modelId].filter((item) => !param.ids.includes(item.id as string)),
					},
				}));
				if (param.onSuccess) param.onSuccess();
			} catch (error) {
				if (param.onError) param.onError(error as APIError);
				throw error;
			}
		},
		updateDataFromModel: async (param) => {
			try {
				const data = await NavigatorService.updateDataFromModel(param);
				const modelId = useModelStore.getState().model._id;
				const subModel = useModelStore.getState().subModel;

				if (param.isSubObjectUpdate) {
					const subModelData = data[subModel.name];
					set({
						subModelData: Array.isArray(subModelData) ? subModelData : [subModelData],
					});
				}

				set((state) => ({
					data: {
						...state.data,
						[modelId]: state.data[modelId].map((item) => {
							if (item.id === param.id) {
								return {
									id: data.id ?? data._id,
									...data,
								};
							}
							return item;
						}),
					},
				}));
				if (param.onSuccess) param.onSuccess(data);
			} catch (error) {
				if (param.onError) param.onError(error as APIError);
				throw error;
			}
		},
		getDataOfSelectedModel: (modelId) => {
			return get().data[modelId];
		},
		reset: () => set(initialState),
	})),
);

export default useNavigatorStore;
