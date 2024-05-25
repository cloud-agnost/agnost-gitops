import { MiddlewareService } from '@/services';
import {
	APIError,
	CreateMiddlewareParams,
	DeleteMiddlewareParams,
	DeleteMultipleMiddlewares,
	GetMiddlewareByIdParams,
	GetModulesRequest,
	Middleware,
	SaveMiddlewareCodeParams,
	UpdateMiddlewareParams,
} from '@/types';
import { isEmpty, updateOrPush } from '@/utils';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import useVersionStore from '../version/versionStore';

interface MiddlewareStore {
	middlewares: Middleware[];
	toEditMiddleware: Middleware;
	workspaceMiddlewares: Middleware[];
	middleware: Middleware;
	isEditMiddlewareModalOpen: boolean;
	lastFetchedPage: number | undefined;
	logics: Record<string, string>;
	isCreateMiddlewareDrawerOpen: boolean;
}

type Actions = {
	getMiddlewares: (params: GetModulesRequest) => Promise<Middleware[]>;
	getMiddlewareById: (params: GetMiddlewareByIdParams) => Promise<Middleware>;
	deleteMiddleware: (params: DeleteMiddlewareParams) => Promise<void>;
	deleteMultipleMiddlewares: (params: DeleteMultipleMiddlewares) => Promise<void>;
	createMiddleware: (params: CreateMiddlewareParams) => Promise<Middleware>;
	updateMiddleware: (params: UpdateMiddlewareParams) => Promise<Middleware>;
	saveMiddlewareLogic: (params: SaveMiddlewareCodeParams) => Promise<Middleware>;
	openEditMiddlewareModal: (middleware: Middleware) => void;
	closeEditMiddlewareModal: () => void;
	setLogics: (id: string, logic: string) => void;
	deleteLogic: (id: string) => void;
	toggleCreateModal: () => void;
	reset: () => void;
};

const initialState: MiddlewareStore = {
	middlewares: [],
	workspaceMiddlewares: [],
	middleware: {} as Middleware,
	lastFetchedPage: undefined,
	isEditMiddlewareModalOpen: false,
	logics: {},
	isCreateMiddlewareDrawerOpen: false,
	toEditMiddleware: {} as Middleware,
};

const useMiddlewareStore = create<MiddlewareStore & Actions>()(
	devtools((set, get) => ({
		...initialState,
		createMiddleware: async (params: CreateMiddlewareParams) => {
			try {
				const middleware = await MiddlewareService.createMiddleware(params);
				set((prev) => ({
					middlewares: [middleware, ...prev.middlewares],
					workspaceMiddlewares: [middleware, ...prev.workspaceMiddlewares].sort((a, b) =>
						a.name.localeCompare(b.name),
					),
				}));
				if (params.onSuccess) {
					params.onSuccess(middleware);
				}
				useVersionStore.setState?.((state) => ({
					dashboard: {
						...state.dashboard,
						middleware: state.dashboard.middleware + 1,
					},
				}));
				return middleware;
			} catch (e) {
				const error = e as APIError;
				if (params.onError) params.onError(error);
				throw e;
			}
		},
		getMiddlewares: async (params: GetModulesRequest) => {
			const middlewares = await MiddlewareService.getMiddlewares(params);
			if (params.workspace) {
				set({ workspaceMiddlewares: middlewares });
				return middlewares;
			}

			if (params.page === 0) {
				set({ middlewares, lastFetchedPage: params.page });
			} else {
				set((prev) => ({
					middlewares: [...prev.middlewares, ...middlewares],
					lastFetchedPage: params.page,
				}));
			}

			return middlewares;
		},
		getMiddlewareById: async (params: GetMiddlewareByIdParams) => {
			const middleware = await MiddlewareService.getMiddlewareById(params);
			set((prev) => {
				const middlewares = updateOrPush(prev.middlewares, middleware);
				return { middleware, middlewares };
			});
			if (isEmpty(get().logics[middleware._id])) {
				get().setLogics(middleware._id, middleware.logic);
			}
			return middleware;
		},
		deleteMiddleware: async (params: DeleteMiddlewareParams) => {
			try {
				await MiddlewareService.deleteMiddleware(params);
				set((prev) => ({
					middlewares: prev.middlewares.filter((mw) => mw._id !== params.middlewareId),
					workspaceMiddlewares: prev.workspaceMiddlewares.filter(
						(mw) => mw._id !== params.middlewareId,
					),
				}));
				if (params.onSuccess) params.onSuccess();
			} catch (e) {
				const error = e as APIError;
				if (params.onError) params.onError(error);
				throw e;
			}
		},
		deleteMultipleMiddlewares: async (params: DeleteMultipleMiddlewares) => {
			await MiddlewareService.deleteMultipleMiddlewares(params);
			set((prev) => ({
				middlewares: prev.middlewares.filter((mw) => !params.middlewareIds.includes(mw._id)),
				workspaceMiddlewares: prev.workspaceMiddlewares.filter(
					(mw) => !params.middlewareIds.includes(mw._id),
				),
			}));
		},
		updateMiddleware: async (params: UpdateMiddlewareParams) => {
			const middleware = await MiddlewareService.updateMiddleware(params);
			set((prev) => ({
				middlewares: prev.middlewares.map((mw) => (mw._id === params.mwId ? middleware : mw)),
				workspaceMiddlewares: prev.workspaceMiddlewares
					.map((mw) => (mw._id === params.mwId ? middleware : mw))
					.sort((a, b) => a.name.localeCompare(b.name)),
				middleware: middleware._id === prev.middleware._id ? middleware : prev.middleware,
			}));
			return middleware;
		},
		saveMiddlewareLogic: async (params: SaveMiddlewareCodeParams) => {
			try {
				const middleware = await MiddlewareService.saveMiddlewareCode(params);
				set((prev) => ({
					middlewares: prev.middlewares.map((mw) =>
						mw._id === params.middlewareId ? middleware : mw,
					),
					workspaceMiddlewares: prev.workspaceMiddlewares.map((mw) =>
						mw._id === params.middlewareId ? middleware : mw,
					),
					middleware,
					editedLogic: middleware.logic,
				}));
				if (params.onSuccess) params.onSuccess(middleware);
				return middleware;
			} catch (error) {
				if (params.onError) params.onError(error as APIError);
				throw error;
			}
		},
		openEditMiddlewareModal: (middleware) => {
			set({ isEditMiddlewareModalOpen: true, toEditMiddleware: middleware });
		},
		closeEditMiddlewareModal: () => {
			set({ isEditMiddlewareModalOpen: false });
		},
		setLogics: (id, logic) => set((prev) => ({ logics: { ...prev.logics, [id]: logic } })),
		deleteLogic: (id) => {
			const { [id]: _, ...rest } = get().logics;
			set({ logics: rest });
		},
		toggleCreateModal: () =>
			set((prev) => ({ isCreateMiddlewareDrawerOpen: !prev.isCreateMiddlewareDrawerOpen })),
		reset: () => set(initialState),
	})),
);

export default useMiddlewareStore;
