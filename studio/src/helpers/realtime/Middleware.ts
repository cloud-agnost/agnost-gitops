import useMiddlewareStore from '@/store/middleware/middlewareStore';
import useTabStore from '@/store/version/tabStore';
import useVersionStore from '@/store/version/versionStore';
import { Middleware as MiddlewareType, RealtimeActionParams } from '@/types';
import { RealtimeActions } from './RealtimeActions';

export default class Middleware implements RealtimeActions<MiddlewareType> {
	delete({ identifiers }: RealtimeActionParams<MiddlewareType>): void {
		const { removeTabByPath } = useTabStore.getState();
		useMiddlewareStore.setState?.((state) => ({
			middlewares: state.middlewares.filter(
				(middleware) => middleware._id !== identifiers.middlewareId,
			),
			workspaceMiddlewares: state.workspaceMiddlewares.filter(
				(middleware) => middleware._id !== identifiers.middlewareId,
			),
		}));
		removeTabByPath(identifiers.versionId as string, identifiers.middlewareId as string);
		useVersionStore.setState?.((state) => ({
			dashboard: {
				...state.dashboard,
				middleware: state.dashboard.middleware - 1,
			},
		}));
	}
	update({ data }: RealtimeActionParams<MiddlewareType>): void {
		const { updateTab } = useTabStore.getState();
		updateTab({
			versionId: data.versionId,
			tab: {
				title: data.name,
			},
			filter: (tab) => tab.path.includes(data._id),
		});
		useMiddlewareStore.setState?.((state) => ({
			middlewares: state.middlewares.map((middleware) =>
				middleware._id === data._id ? data : middleware,
			),
			workspaceMiddlewares: state.workspaceMiddlewares.map((middleware) =>
				middleware._id === data._id ? data : middleware,
			),
			middleware: data._id === state.middleware._id ? data : state.middleware,
		}));
		if (data.logic) {
			useMiddlewareStore.getState?.().setLogics(data._id, data.logic);
		}
	}
	create({ data }: RealtimeActionParams<MiddlewareType>): void {
		useMiddlewareStore.setState?.((state) => ({
			middlewares: [data, ...state.middlewares],
			workspaceMiddlewares: [data, ...state.workspaceMiddlewares],
		}));
		useVersionStore.setState?.((state) => ({
			dashboard: {
				...state.dashboard,
				middleware: state.dashboard.middleware + 1,
			},
		}));
	}
	telemetry(param: RealtimeActionParams<MiddlewareType>): void {
		this.update(param);
	}
}
