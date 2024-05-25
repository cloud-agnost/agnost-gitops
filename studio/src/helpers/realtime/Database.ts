import useDatabaseStore from '@/store/database/databaseStore';
import useModelStore from '@/store/database/modelStore';
import useTabStore from '@/store/version/tabStore';
import useVersionStore from '@/store/version/versionStore';
import { Database as DatabaseType, RealtimeActionParams } from '@/types';
import _ from 'lodash';
import { RealtimeActions } from './RealtimeActions';

class Database implements RealtimeActions<DatabaseType> {
	delete({ identifiers }: RealtimeActionParams<DatabaseType>): void {
		const { removeTabByPath } = useTabStore.getState();
		useDatabaseStore.setState?.((state) => ({
			databases: state.databases.filter((database) => database._id !== identifiers.dbId),
			workspaceDatabases: state.workspaceDatabases.filter(
				(database) => database._id !== identifiers.dbId,
			),
		}));

		useModelStore.setState?.((state) => ({
			models: _.omit(state.models, identifiers.dbId as string),
		}));

		removeTabByPath(identifiers.versionId as string, identifiers.dbId as string);
		useVersionStore.setState?.((state) => ({
			dashboard: {
				...state.dashboard,
				database: state.dashboard.database - 1,
			},
		}));
	}
	update({ data }: RealtimeActionParams<DatabaseType>): void {
		const { updateTab } = useTabStore.getState();
		useDatabaseStore.setState?.((state) => ({
			databases: state.databases.map((database) => (database._id === data._id ? data : database)),
			workspaceDatabases: state.workspaceDatabases.map((database) =>
				database._id === data._id ? data : database,
			),
			database: data._id === state.database._id ? data : state.database,
		}));
		updateTab({
			versionId: data.versionId,
			tab: {
				title: data.name,
			},
			filter: (tab) => tab.path.includes(data._id),
		});
	}
	create({ data }: RealtimeActionParams<DatabaseType>): void {
		useDatabaseStore.setState?.((state) => ({
			databases: [data, ...state.databases],
			workspaceDatabases: [data, ...state.workspaceDatabases],
		}));
		useVersionStore.setState?.((state) => ({
			dashboard: {
				...state.dashboard,
				database: state.dashboard.database + 1,
			},
		}));
	}
	telemetry(param: RealtimeActionParams<DatabaseType>): void {
		this.update(param);
	}
}
export default Database;
