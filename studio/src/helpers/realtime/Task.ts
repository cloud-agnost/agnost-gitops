import useTaskStore from '@/store/task/taskStore';
import useTabStore from '@/store/version/tabStore';
import useUtilsStore from '@/store/version/utilsStore';
import useVersionStore from '@/store/version/versionStore';
import { LogTypes, RealtimeActionParams, Task as TaskType } from '@/types';
import { RealtimeActions } from './RealtimeActions';
class Task implements RealtimeActions<TaskType> {
	log({ message, timestamp, id, type }: RealtimeActionParams<TaskType>) {
		setTimeout(() => {
			useUtilsStore.getState?.().setTaskLogs(id as string, {
				message: message as string,
				timestamp: timestamp as string,
				type: type as LogTypes,
			});
		}, 100);
	}
	delete({ identifiers }: RealtimeActionParams<TaskType>) {
		const { removeTabByPath } = useTabStore.getState();
		useTaskStore.setState?.((state) => ({
			tasks: state.tasks.filter((task) => task._id !== identifiers.taskId),
			workspaceTasks: state.workspaceTasks.filter((task) => task._id !== identifiers.taskId),
		}));
		removeTabByPath(identifiers.versionId as string, identifiers.taskId as string);
		useVersionStore.setState?.((state) => ({
			dashboard: {
				...state.dashboard,
				task: state.dashboard.task - 1,
			},
		}));
	}
	update({ data }: RealtimeActionParams<TaskType>) {
		const { updateTab } = useTabStore.getState();
		updateTab({
			versionId: data.versionId as string,
			tab: {
				title: data.name,
				...(data.logic && { logic: data.logic }),
			},
			filter: (tab) => tab.path.includes(data._id as string),
		});
		useTaskStore.setState?.((state) => ({
			tasks: state.tasks.map((task) => (task._id === data._id ? data : task)),
			workspaceTasks: state.workspaceTasks.map((task) => (task._id === data._id ? data : task)),
			task: data._id === state.task._id ? data : state.task,
		}));
		if (data.logic) {
			useTaskStore.getState?.().setLogics(data._id, data.logic);
		}
	}
	create({ data }: RealtimeActionParams<TaskType>) {
		useTaskStore.setState?.((state) => ({
			tasks: [data, ...state.tasks],
			workspaceTasks: [data, ...state.workspaceTasks],
		}));
		useVersionStore.setState?.((state) => ({
			dashboard: {
				...state.dashboard,
				task: state.dashboard.task + 1,
			},
		}));
	}
	telemetry(params: RealtimeActionParams<TaskType>) {
		this.update(params);
	}
}
export default Task;
