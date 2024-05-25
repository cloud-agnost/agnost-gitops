import QueueService from '@/services/QueueService';
import {
	APIError,
	CreateMessageQueueParams,
	DeleteMessageQueueParams,
	DeleteMultipleQueuesParams,
	GetMessageQueueByIdParams,
	GetMessageQueuesParams,
	MessageQueue,
	TestQueueParams,
	UpdateQueueLogicParams,
	UpdateQueueParams,
} from '@/types';
import { isEmpty, updateOrPush } from '@/utils';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import useUtilsStore from '../version/utilsStore';
import useVersionStore from '../version/versionStore';

interface MessageQueueStore {
	queues: MessageQueue[];
	workspaceQueues: MessageQueue[];
	queue: MessageQueue;
	toEditQueue: MessageQueue;
	lastFetchedPage: number | undefined;
	isEditQueueModalOpen: boolean;
	logics: Record<string, string>;
	isCreateQueueModalOpen: boolean;
}

type Actions = {
	getQueues: (params: GetMessageQueuesParams) => Promise<MessageQueue[]>;
	getQueueById: (params: GetMessageQueueByIdParams) => Promise<MessageQueue>;
	deleteQueue: (params: DeleteMessageQueueParams) => Promise<void>;
	deleteMultipleQueues: (params: DeleteMultipleQueuesParams) => Promise<void>;
	createQueue: (params: CreateMessageQueueParams) => Promise<MessageQueue>;
	updateQueue: (params: UpdateQueueParams) => Promise<MessageQueue>;
	saveQueueLogic: (params: UpdateQueueLogicParams) => Promise<MessageQueue>;
	testQueue: (params: TestQueueParams) => Promise<void>;
	openEditQueueModal: (queue: MessageQueue) => void;
	closeEditQueueModal: () => void;
	setLogics: (id: string, logic: string) => void;
	deleteLogic: (id: string) => void;
	toggleCreateModal: () => void;
	reset: () => void;
};

const initialState: MessageQueueStore = {
	queues: [],
	workspaceQueues: [],
	queue: {} as MessageQueue,
	lastFetchedPage: undefined,
	isEditQueueModalOpen: false,
	logics: {},
	isCreateQueueModalOpen: false,
	toEditQueue: {} as MessageQueue,
};

const useMessageQueueStore = create<MessageQueueStore & Actions>()(
	devtools((set, get) => ({
		...initialState,
		openEditQueueModal: (queue: MessageQueue) => {
			set({ toEditQueue: queue, isEditQueueModalOpen: true });
		},
		closeEditQueueModal: () => {
			set({ isEditQueueModalOpen: false });
		},
		getQueues: async (params: GetMessageQueuesParams) => {
			const queues = await QueueService.getQueues(params);
			if (params.workspace) {
				set({ workspaceQueues: queues });
				return queues;
			}
			if (params.page === 0) {
				set({ queues, lastFetchedPage: params.page });
			} else {
				set((prev) => ({
					queues: [...prev.queues, ...queues],
					lastFetchedPage: params.page,
				}));
			}
			return queues;
		},
		getQueueById: async (params: GetMessageQueueByIdParams) => {
			const queue = await QueueService.getQueueById(params);
			set((prev) => {
				const updatedList = updateOrPush(prev.queues, queue);
				return { queue, queues: updatedList };
			});
			if (isEmpty(get().logics[queue._id])) {
				get().setLogics(queue._id, queue.logic);
			}
			return queue;
		},
		deleteQueue: async (params: DeleteMessageQueueParams) => {
			try {
				await QueueService.deleteQueue(params);
				set((prev) => ({
					queues: prev.queues.filter((queue) => queue._id !== params.queueId),
					workspaceQueues: prev.workspaceQueues.filter((queue) => queue._id !== params.queueId),
				}));

				useUtilsStore.setState?.((prev) => {
					const { [params.queueId]: _, ...rest } = prev.testQueueLogs;
					return { testQueueLogs: rest };
				});

				if (params.onSuccess) params.onSuccess();
			} catch (error) {
				if (params.onError) params.onError(error as APIError);
				throw error as APIError;
			}
		},
		deleteMultipleQueues: async (params: DeleteMultipleQueuesParams) => {
			try {
				const queue = await QueueService.deleteMultipleQueues(params);
				set((prev) => ({
					queues: prev.queues.filter((queue) => !params.queueIds.includes(queue._id)),
					workspaceQueues: prev.workspaceQueues.filter(
						(queue) => !params.queueIds.includes(queue._id),
					),
				}));
				useUtilsStore.setState?.((prev) => {
					const testQueueLogs = prev.testQueueLogs;
					params.queueIds.forEach((id) => {
						delete testQueueLogs[id];
					});
					return { testQueueLogs: testQueueLogs };
				});
				if (params.onSuccess) params.onSuccess(queue);
			} catch (error) {
				if (params.onError) params.onError(error as APIError);
				throw error as APIError;
			}
		},
		createQueue: async (params: CreateMessageQueueParams) => {
			try {
				const queue = await QueueService.createQueue(params);
				set((prev) => ({
					queues: [queue, ...prev.queues],
					workspaceQueues: [queue, ...prev.workspaceQueues].sort((a, b) =>
						a.name.localeCompare(b.name),
					),
				}));
				if (params.onSuccess) params.onSuccess(queue);
				useVersionStore.setState?.((state) => ({
					dashboard: {
						...state.dashboard,
						queue: state.dashboard.queue + 1,
					},
				}));
				return queue;
			} catch (error) {
				if (params.onError) params.onError(error as APIError);
				throw error as APIError;
			}
		},
		updateQueue: async (params: UpdateQueueParams) => {
			try {
				const queue = await QueueService.updateQueue(params);
				set((prev) => ({
					queues: prev.queues.map((q) => (q._id === queue._id ? queue : q)),
					workspaceQueues: prev.workspaceQueues
						.map((q) => (q._id === queue._id ? queue : q))
						.sort((a, b) => a.name.localeCompare(b.name)),
					queue: queue._id === prev.queue._id ? queue : prev.queue,
				}));
				if (params.onSuccess) params.onSuccess();
				return queue;
			} catch (error) {
				if (params.onError) params.onError(error as APIError);
				throw error as APIError;
			}
		},
		saveQueueLogic: async (params: UpdateQueueLogicParams) => {
			try {
				const queue = await QueueService.updateQueueLogic(params);
				set((prev) => ({
					queues: prev.queues.map((q) => (q._id === queue._id ? queue : q)),
					workspaceQueues: prev.workspaceQueues.map((q) => (q._id === queue._id ? queue : q)),
					queue,
					editedLogic: queue.logic,
				}));
				if (params.onSuccess) params.onSuccess();
				return queue;
			} catch (error) {
				if (params.onError) params.onError(error as APIError);
				throw error as APIError;
			}
		},
		testQueue: async (params: TestQueueParams) => {
			try {
				await QueueService.testQueue(params);
				useUtilsStore.getState().setTestQueueLogs(params.payload, params.queueId);
				if (params.onSuccess) params.onSuccess();
			} catch (error) {
				if (params.onError) params.onError(error as APIError);
				throw error as APIError;
			}
		},
		setLogics: (id, logic) => set((prev) => ({ logics: { ...prev.logics, [id]: logic } })),
		deleteLogic: (id) => {
			const { [id]: _, ...rest } = get().logics;
			set({ logics: rest });
		},
		toggleCreateModal: () => {
			set((prev) => ({ isCreateQueueModalOpen: !prev.isCreateQueueModalOpen }));
		},
		reset: () => set(initialState),
	})),
);

export default useMessageQueueStore;
