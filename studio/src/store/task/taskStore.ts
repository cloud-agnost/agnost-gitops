import TaskService from '@/services/TaskService';
import {
	APIError,
	CreateTaskParams,
	DeleteMultipleTasksParams,
	DeleteTaskParams,
	GetTaskParams,
	GetTasksParams,
	Log,
	SaveTaskLogicParams,
	Task,
	TestTaskParams,
	UpdateTaskParams,
} from '@/types';
import { isEmpty, updateOrPush } from '@/utils';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import useUtilsStore from '../version/utilsStore';
import useVersionStore from '../version/versionStore';
export interface TaskStore {
	task: Task;
	toEditTask: Task;
	workspaceTasks: Task[];
	tasks: Task[];
	lastFetchedPage: number | undefined;
	isEditTaskModalOpen: boolean;
	logics: Record<string, string>;
	isCreateTaskModalOpen: boolean;
}

type Actions = {
	openEditTaskModal: (task: Task) => void;
	closeEditTaskModal: () => void;
	getTask: (params: GetTaskParams) => Promise<Task>;
	getTasks: (params: GetTasksParams) => Promise<Task[]>;
	createTask: (params: CreateTaskParams) => Promise<Task>;
	updateTask: (params: UpdateTaskParams) => Promise<Task>;
	deleteTask: (params: DeleteTaskParams) => Promise<Task>;
	deleteMultipleTasks: (params: DeleteMultipleTasksParams) => Promise<Task[]>;
	saveTaskLogic: (params: SaveTaskLogicParams) => Promise<Task>;
	testTask: (params: TestTaskParams) => Promise<void>;
	setLogics: (id: string, logic: string) => void;
	deleteLogic: (id: string) => void;
	toggleCreateModal: () => void;
	reset: () => void;
};

const initialState: TaskStore = {
	task: {} as Task,
	toEditTask: {} as Task,
	tasks: [],
	workspaceTasks: [],
	lastFetchedPage: undefined,
	isEditTaskModalOpen: false,
	isCreateTaskModalOpen: false,
	logics: {},
};

const useTaskStore = create<TaskStore & Actions>()(
	devtools((set, get) => ({
		...initialState,
		openEditTaskModal: (task: Task) => {
			set({ toEditTask: task, isEditTaskModalOpen: true });
		},
		closeEditTaskModal: () => {
			set({ isEditTaskModalOpen: false });
		},
		getTask: async (params: GetTaskParams) => {
			const task = await TaskService.getTask(params);
			set((prev) => {
				const tasks = updateOrPush(prev.tasks, task);
				return { task, tasks };
			});
			if (isEmpty(get().logics[task._id])) {
				get().setLogics(task._id, task.logic);
			}
			return task;
		},
		getTasks: async (params: GetTasksParams) => {
			const tasks = await TaskService.getTasks(params);
			if (params.workspace) {
				set({ workspaceTasks: tasks });
				return tasks;
			}

			if (params.page === 0) {
				set({ tasks, lastFetchedPage: params.page });
			} else {
				set({ tasks: [...tasks, ...tasks], lastFetchedPage: params.page });
			}

			return tasks;
		},
		createTask: async (params: CreateTaskParams) => {
			try {
				const task = await TaskService.createTask(params);
				set((prev) => ({
					tasks: [task, ...prev.tasks],
					workspaceTasks: [task, ...prev.workspaceTasks].sort((a, b) =>
						a.name.localeCompare(b.name),
					),
					task,
				}));
				if (params.onSuccess) params.onSuccess(task);
				useVersionStore.setState?.((state) => ({
					dashboard: {
						...state.dashboard,
						task: state.dashboard.task + 1,
					},
				}));
				return task;
			} catch (error) {
				if (params.onError) params.onError(error as APIError);
				throw error as APIError;
			}
		},
		updateTask: async (params: UpdateTaskParams) => {
			try {
				const task = await TaskService.updateTaskProperties(params);
				set((prev) => ({
					workspaceTasks: prev.workspaceTasks
						.map((t) => (t._id === task._id ? task : t))
						.sort((a, b) => a.name.localeCompare(b.name)),
					tasks: prev.tasks.map((t) => (t._id === task._id ? task : t)),
					task: task._id === prev.task._id ? task : prev.task,
				}));

				if (params.onSuccess) params.onSuccess();
				return task;
			} catch (error) {
				if (params.onError) params.onError(error as APIError);
				throw error as APIError;
			}
		},
		saveTaskLogic: async (params: SaveTaskLogicParams) => {
			try {
				const task = await TaskService.saveTaskLogic(params);
				set((prev) => ({
					workspaceTasks: prev.workspaceTasks.map((t) => (t._id === task._id ? task : t)),
					tasks: prev.tasks.map((t) => (t._id === task._id ? task : t)),
					task,
				}));
				return task;
			} catch (error) {
				throw error as APIError;
			}
		},
		deleteTask: async (params: DeleteTaskParams) => {
			try {
				const task = await TaskService.deleteTask(params);
				set((prev) => ({
					workspaceTasks: prev.workspaceTasks.filter((task) => task._id !== params.taskId),
					tasks: prev.tasks.filter((task) => task._id !== params.taskId),
				}));
				useUtilsStore.setState((prev) => {
					const { [params.taskId]: _, ...restLogs } = prev.taskLogs;
					return { taskLogs: restLogs };
				});
				if (params.onSuccess) params.onSuccess();
				return task;
			} catch (error) {
				if (params.onError) params.onError(error as APIError);
				throw error as APIError;
			}
		},
		deleteMultipleTasks: async (params: DeleteMultipleTasksParams) => {
			try {
				const tasks = await TaskService.deleteMultipleTasks(params);
				set((prev) => ({
					workspaceTasks: prev.workspaceTasks.filter((task) => !params.taskIds.includes(task._id)),
					tasks: prev.tasks.filter((task) => !params.taskIds.includes(task._id)),
				}));

				useUtilsStore.setState?.((prev) => {
					const taskLogs = prev.taskLogs;
					params.taskIds.forEach((id) => {
						delete taskLogs[id];
					});
					return { taskLogs: taskLogs };
				});
				if (params.onSuccess) params.onSuccess();
				return tasks;
			} catch (error) {
				if (params.onError) params.onError(error as APIError);
				throw error as APIError;
			}
		},
		testTask: async (params) => {
			try {
				await TaskService.testTask(params);
				useUtilsStore.setState((prev) => ({
					taskLogs: {
						...prev.taskLogs,
						[params.taskId]: [],
					},
				}));
				if (params.onSuccess) params.onSuccess();
				useUtilsStore.getState().setTaskLogs(params.taskId, {} as Log);
			} catch (error) {
				if (params.onError) params.onError(error as APIError);
				throw error as APIError;
			}
		},
		toggleCreateModal: () => {
			set((prev) => ({ isCreateTaskModalOpen: !prev.isCreateTaskModalOpen }));
		},
		setLogics: (id, logic) => set((prev) => ({ logics: { ...prev.logics, [id]: logic } })),
		deleteLogic: (id) => {
			const { [id]: _, ...rest } = get().logics;
			set({ logics: rest });
		},
		reset: () => set(initialState),
	})),
);

export default useTaskStore;
