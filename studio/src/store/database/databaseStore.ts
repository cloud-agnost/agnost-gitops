import { DatabaseService } from '@/services';
import {
	CreateDatabaseParams,
	Database,
	DeleteDatabaseParams,
	GetDatabaseOfAppByIdParams,
	GetDatabasesOfAppParams,
	UpdateDatabaseParams,
} from '@/types';
import { updateOrPush } from '@/utils';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import useVersionStore from '../version/versionStore';

interface DatabaseStore {
	databases: Database[];
	workspaceDatabases: Database[];
	database: Database;
	toDeleteDatabase: Database;
	isDeleteDatabaseDialogOpen: boolean;
	isEditDatabaseDialogOpen: boolean;
	isDatabaseFetched: boolean;
	isCreateDatabaseDialogOpen: boolean;
}

type Actions = {
	getDatabases: (params: GetDatabasesOfAppParams) => Promise<Database[]>;
	getDatabaseOfAppById: (params: GetDatabaseOfAppByIdParams) => Promise<Database>;
	createDatabase: (params: CreateDatabaseParams) => Promise<Database>;
	updateDatabase: (params: UpdateDatabaseParams) => Promise<Database>;
	deleteDatabase: (params: DeleteDatabaseParams) => Promise<void>;
	setDatabase: (database: Database) => void;
	openDeleteDatabaseModal: (db: Database) => void;
	closeDeleteDatabaseModal: () => void;
	openEditDatabaseModal: (db: Database) => void;
	closeEditDatabaseModal: () => void;
	toggleCreateModal: () => void;
	reset: () => void;
};

const initialState: DatabaseStore = {
	databases: [],
	workspaceDatabases: [],
	database: {} as Database,
	toDeleteDatabase: {} as Database,
	isDeleteDatabaseDialogOpen: false,
	isEditDatabaseDialogOpen: false,
	isDatabaseFetched: false,
	isCreateDatabaseDialogOpen: false,
};

const useDatabaseStore = create<DatabaseStore & Actions>()(
	devtools(
		(set) => ({
			...initialState,
			openDeleteDatabaseModal: (db: Database) =>
				set({
					isDeleteDatabaseDialogOpen: true,
					toDeleteDatabase: db,
				}),
			closeDeleteDatabaseModal: () =>
				set({
					isDeleteDatabaseDialogOpen: false,
					toDeleteDatabase: {} as Database,
				}),
			openEditDatabaseModal: (db: Database) =>
				set({
					isEditDatabaseDialogOpen: true,
					database: db,
				}),
			closeEditDatabaseModal: () =>
				set({
					isEditDatabaseDialogOpen: false,
					database: {} as Database,
				}),
			getDatabases: async (params: GetDatabasesOfAppParams): Promise<Database[]> => {
				const databases = await DatabaseService.getDatabases(params);
				if (params.workspace) {
					set({ workspaceDatabases: databases });
					return databases;
				}
				set({ databases, isDatabaseFetched: true });
				return databases;
			},
			getDatabaseOfAppById: async (params: GetDatabaseOfAppByIdParams): Promise<Database> => {
				const database = await DatabaseService.getDatabaseOfAppById(params);
				set((prev) => {
					const updatedList = updateOrPush(prev.databases, database);
					return { database, databases: updatedList };
				});
				return database;
			},
			createDatabase: async (params: CreateDatabaseParams): Promise<Database> => {
				const database = await DatabaseService.createDatabase(params);
				set((prev) => ({
					databases: [database, ...prev.databases],
					workspaceDatabases: [database, ...prev.workspaceDatabases].sort((a, b) =>
						a.name.localeCompare(b.name),
					),
				}));
				useVersionStore.setState?.((state) => ({
					dashboard: {
						...state.dashboard,
						database: state.dashboard.database + 1,
					},
				}));
				return database;
			},
			updateDatabase: async (params: UpdateDatabaseParams): Promise<Database> => {
				const database = await DatabaseService.updateDatabaseName(params);
				set((prev) => ({
					databases: prev.databases.map((db) => (db._id === database._id ? database : db)),
					workspaceDatabases: prev.workspaceDatabases
						.map((db) => (db._id === database._id ? database : db))
						.sort((a, b) => a.name.localeCompare(b.name)),
					database: database._id === prev.database._id ? database : prev.database,
				}));
				return database;
			},
			deleteDatabase: async (params: DeleteDatabaseParams) => {
				await DatabaseService.deleteDatabase(params);
				set((prev) => ({
					databases: prev.databases.filter((db) => db._id !== params.dbId),
					workspaceDatabases: prev.workspaceDatabases.filter((db) => db._id !== params.dbId),
				}));
			},
			toggleCreateModal: () =>
				set((prev) => ({
					isCreateDatabaseDialogOpen: !prev.isCreateDatabaseDialogOpen,
				})),
			setDatabase: (database: Database) => set({ database }),
			reset: () => set(initialState),
		}),
		{
			name: 'database',
		},
	),
);

export default useDatabaseStore;
