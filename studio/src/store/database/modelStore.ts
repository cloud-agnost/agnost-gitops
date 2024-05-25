import { ModelService } from '@/services';
import {
	APIError,
	AddNewFieldParams,
	CreateModelParams,
	DeleteFieldParams,
	DeleteModelParams,
	DeleteMultipleFieldParams,
	DeleteMultipleModelParams,
	DisableTimestampsParams,
	EnableTimestampsParams,
	Field,
	FieldType,
	GetModelsOfDatabaseParams,
	GetSpecificModelByIidOfDatabase,
	GetSpecificModelOfDatabase,
	Model,
	UpdateFieldParams,
	UpdateNameAndDescriptionParams,
} from '@/types';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ModelStore {
	models: {
		[dbId: string]: Model[];
	};
	workspaceModels: {
		[dbId: string]: Model[];
	};
	model: Model;
	field: Field;
	subModel: Model;
	referenceModels: Model[];
	nestedModels: {
		name: string;
		index: number;
	}[];
	isEditModelDialogOpen: boolean;
	isEditFieldDialogOpen: boolean;
	isCreateModelDialogOpen: boolean;
	selectedType: FieldType;
	isModelsFetched: boolean;
}

type Actions = {
	openEditModelModal: (model: Model) => void;
	closeEditModelModal: () => void;
	toggleCreateModal: () => void;
	openEditFieldDialog: (field: Field) => void;
	closeEditFieldDialog: () => void;
	getModels: (params: GetModelsOfDatabaseParams) => Promise<Model[]>;
	getSpecificModelByIidOfDatabase: (params: GetSpecificModelByIidOfDatabase) => Promise<Model>;
	getSpecificModelOfDatabase: (params: GetSpecificModelOfDatabase) => Promise<Model>;
	createModel: (params: CreateModelParams) => Promise<Model>;
	deleteModel: (params: DeleteModelParams) => Promise<void>;
	deleteMultipleModel: (params: DeleteMultipleModelParams) => Promise<void>;
	updateNameAndDescription: (params: UpdateNameAndDescriptionParams) => Promise<Model>;
	addNewField: (params: AddNewFieldParams) => Promise<Model>;
	deleteField: (params: DeleteFieldParams) => Promise<Model>;
	deleteMultipleField: (params: DeleteMultipleFieldParams) => Promise<Model>;
	updateField: (params: UpdateFieldParams) => Promise<Model>;
	getReferenceModels: (params: GetModelsOfDatabaseParams) => Promise<Model[]>;
	enableTimestamps: (params: EnableTimestampsParams) => Promise<Model>;
	disableTimestamps: (params: DisableTimestampsParams) => Promise<Model>;
	setModel: (model: Model) => void;
	setNestedModels: (modelName: string, index: number) => void;
	resetNestedModels: () => void;
	getModelsTitle: () => string;
	setSelectedType: (selectedType: FieldType) => void;
	getModelsOfSelectedDb: (dbId: string) => Model[] | undefined;
	reset: () => void;
};

const initialState: ModelStore = {
	models: {},
	workspaceModels: {},
	model: {} as Model,
	subModel: {} as Model,
	field: {} as Field,
	nestedModels: [],
	referenceModels: [],
	isEditModelDialogOpen: false,
	isEditFieldDialogOpen: false,
	selectedType: {} as FieldType,
	isModelsFetched: false,
	isCreateModelDialogOpen: false,
};

const useModelStore = create<ModelStore & Actions>()(
	devtools(
		persist(
			(set, get) => ({
				...initialState,
				toggleCreateModal: () =>
					set((prev) => ({
						isCreateModelDialogOpen: !prev.isCreateModelDialogOpen,
					})),
				openEditModelModal: (model: Model) =>
					set({
						isEditModelDialogOpen: true,
						model,
					}),
				closeEditModelModal: () =>
					set({
						isEditModelDialogOpen: false,
						model: {} as Model,
					}),
				openEditFieldDialog: (field: Field) =>
					set({
						isEditFieldDialogOpen: true,
						field,
					}),
				closeEditFieldDialog: () =>
					set({
						isEditFieldDialogOpen: false,
						field: {} as Field,
					}),

				getModels: async (params: GetModelsOfDatabaseParams): Promise<Model[]> => {
					const models = await ModelService.getModelsOfDatabase(params);

					if (params.workspace) {
						set((state) => ({
							workspaceModels: {
								...state.workspaceModels,
								[params.dbId]: models,
							},
						}));
						return models;
					}
					set((state) => ({
						models: {
							...state.models,
							[params.dbId]: models,
						},
						isModelsFetched: true,
					}));
					return models;
				},
				getSpecificModelByIidOfDatabase: async (
					params: GetSpecificModelByIidOfDatabase,
				): Promise<Model> => {
					try {
						const subModel = await ModelService.getSpecificModelByIidOfDatabase(params);
						set({ subModel });
						if (params.onSuccess) params.onSuccess(subModel);
						return subModel;
					} catch (e) {
						if (params.onError) params.onError(e as APIError);
						throw e;
					}
				},
				getSpecificModelOfDatabase: async (params: GetSpecificModelOfDatabase): Promise<Model> => {
					const model = await ModelService.getSpecificModelOfDatabase(params);
					set({ model });
					return model;
				},
				createModel: async (params: CreateModelParams): Promise<Model> => {
					const model = await ModelService.createModel(params);
					set((state) => ({
						models: {
							...state.models,
							[params.dbId]: [...state.models[params.dbId], model],
						},
						workspaceModels: {
							...state.workspaceModels,
							[params.dbId]: [...state.models[params.dbId], model].sort((a, b) =>
								a.name.localeCompare(b.name),
							),
						},
					}));
					return model;
				},
				updateNameAndDescription: async (
					params: UpdateNameAndDescriptionParams,
				): Promise<Model> => {
					const model = await ModelService.updateNameAndDescription(params);

					set((state) => ({
						models: {
							...state.models,
							[params.dbId]: state.models[params.dbId]?.map((m) =>
								m._id === model._id ? model : m,
							),
						},
						workspaceModels: {
							...state.workspaceModels,
							[params.dbId]: state.models[params.dbId]
								?.map((m) => (m._id === model._id ? model : m))
								.sort((a, b) => a.name.localeCompare(b.name)),
						},
						model,
					}));
					return model;
				},
				addNewField: async (params: AddNewFieldParams): Promise<Model> => {
					const model = await ModelService.addNewField(params);
					set((state) => ({
						models: {
							...state.models,
							[params.dbId]: state.models[params.dbId]?.map((m) =>
								m._id === model._id ? model : m,
							),
						},
						workspaceModels: {
							...state.workspaceModels,
							[params.dbId]: state.models[params.dbId]?.map((m) =>
								m._id === model._id ? model : m,
							),
						},
						model,
					}));
					return model;
				},
				deleteField: async (params: DeleteFieldParams): Promise<Model> => {
					const model = await ModelService.deleteField(params);
					set((state) => ({
						models: {
							...state.models,
							[params.dbId]: state.models[params.dbId]?.map((m) =>
								m._id === model._id ? model : m,
							),
						},
						workspaceModels: {
							...state.workspaceModels,
							[params.dbId]: state.models[params.dbId]?.map((m) =>
								m._id === model._id ? model : m,
							),
						},
						model,
					}));
					return model;
				},
				deleteMultipleField: async (params: DeleteMultipleFieldParams): Promise<Model> => {
					const model = await ModelService.deleteMultipleField(params);
					set((state) => ({
						models: {
							...state.models,
							[params.dbId]: state.models[params.dbId]?.map((m) =>
								m._id === model._id ? model : m,
							),
						},
						workspaceModels: {
							...state.workspaceModels,
							[params.dbId]: state.models[params.dbId]?.map((m) =>
								m._id === model._id ? model : m,
							),
						},
						model,
					}));
					return model;
				},
				deleteModel: async (params: DeleteModelParams): Promise<void> => {
					await ModelService.deleteModel(params);
					set((state) => ({
						models: {
							...state.models,
							[params.dbId]: state.models[params.dbId].filter((m) => m._id !== params.modelId),
						},
						workspaceModels: {
							...state.workspaceModels,
							[params.dbId]: state.models[params.dbId].filter((m) => m._id !== params.modelId),
						},
					}));
				},
				deleteMultipleModel: async (params: DeleteMultipleModelParams): Promise<void> => {
					await ModelService.deleteMultipleModel(params);
					set((state) => ({
						models: {
							...state.models,
							[params.dbId]: state.models[params.dbId].filter(
								(m) => !params.modelIds.includes(m._id),
							),
						},
						workspaceModels: {
							...state.workspaceModels,
							[params.dbId]: state.models[params.dbId].filter(
								(m) => !params.modelIds.includes(m._id),
							),
						},
					}));
				},
				updateField: async (params: UpdateFieldParams): Promise<Model> => {
					const model = await ModelService.updateField(params);
					set((state) => ({
						models: {
							...state.models,
							[params.dbId]: state.models[params.dbId]?.map((m) =>
								m._id === model._id ? model : m,
							),
						},
						workspaceModels: {
							...state.workspaceModels,
							[params.dbId]: state.models[params.dbId]?.map((m) =>
								m._id === model._id ? model : m,
							),
						},
						model,
					}));
					return model;
				},
				getReferenceModels: async (params: GetModelsOfDatabaseParams): Promise<Model[]> => {
					const referenceModels = await ModelService.getReferenceModels(params);
					set({ referenceModels });
					return referenceModels;
				},
				enableTimestamps: async (params: EnableTimestampsParams): Promise<Model> => {
					const model = await ModelService.enableTimestamps(params);
					set((state) => ({
						models: {
							...state.models,
							[params.dbId]: state.models[params.dbId]?.map((m) =>
								m._id === model._id ? model : m,
							),
						},
						workspaceModels: {
							...state.workspaceModels,
							[params.dbId]: state.models[params.dbId]?.map((m) =>
								m._id === model._id ? model : m,
							),
						},
						model,
					}));
					return model;
				},
				disableTimestamps: async (params: DisableTimestampsParams): Promise<Model> => {
					const model = await ModelService.disableTimestamps(params);
					set((state) => ({
						models: {
							...state.models,
							[params.dbId]: state.models[params.dbId]?.map((m) =>
								m._id === model._id ? model : m,
							),
						},
						workspaceModels: {
							...state.workspaceModels,
							[params.dbId]: state.models[params.dbId]?.map((m) =>
								m._id === model._id ? model : m,
							),
						},
						model,
					}));
					return model;
				},
				setModel: (model: Model) => {
					set({ subModel: {} as Model, model });
				},
				setNestedModels: (modelName: string, index: number) => {
					set((state) => ({
						nestedModels: [
							...state.nestedModels,
							{
								name: modelName,
								index,
							},
						],
					}));
				},
				resetNestedModels: () => {
					set({ nestedModels: [] });
				},
				getModelsTitle: () => {
					const nestedModels = get().nestedModels;
					const nestedModelsString = nestedModels.length
						? '.' + nestedModels.map((m) => m.name).join('.')
						: '';
					return get().model ? `${get().model.name}${nestedModelsString}` : '';
				},
				setSelectedType: (selectedType: FieldType) => set({ selectedType }),
				getModelsOfSelectedDb: (dbId: string) => {
					return get().models[dbId];
				},
				reset: () => set(initialState),
			}),
			{
				name: 'model-store',
				partialize: (state) =>
					Object.fromEntries(Object.entries(state).filter(([key]) => ['model'].includes(key))),
			},
		),
	),
);

export default useModelStore;
