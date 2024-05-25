import { DatabaseColumns } from '@/features/database';
import { useSearch, useTable, useUpdateEffect } from '@/hooks';
import useAuthorizeVersion from '@/hooks/useAuthorizeVersion.tsx';
import { VersionTabLayout } from '@/layouts/VersionLayout';
import useApplicationStore from '@/store/app/applicationStore';
import useDatabaseStore from '@/store/database/databaseStore.ts';
import useVersionStore from '@/store/version/versionStore';
import { Database, TabTypes } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from 'components/DataTable';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
export default function VersionDatabase() {
	const { application } = useApplicationStore();
	const { version } = useVersionStore();
	const { databases, isDatabaseFetched, toggleCreateModal, getDatabases } = useDatabaseStore();
	const { t } = useTranslation();
	const canEdit = useAuthorizeVersion('db.create');

	const { versionId, appId, orgId } = useParams<{
		versionId: string;
		appId: string;
		orgId: string;
	}>();

	const filteredDatabase = useSearch(databases);

	const { isFetching, refetch } = useQuery({
		queryKey: ['getDatabases', orgId, version?._id, versionId, application?._id, appId],
		queryFn: () =>
			getDatabases({
				orgId: orgId as string,
				versionId: version?._id ?? (versionId as string),
				appId: application?._id ?? (appId as string),
			}),
		enabled: !isDatabaseFetched,
		refetchOnWindowFocus: false,
	});

	const table = useTable({
		data: filteredDatabase,
		columns: DatabaseColumns,
	});

	useUpdateEffect(() => {
		refetch();
	}, [orgId, appId, versionId]);

	return (
		<VersionTabLayout
			searchable
			isEmpty={databases.length === 0}
			title={t('database.page_title') as string}
			type={TabTypes.Database}
			openCreateModal={toggleCreateModal}
			selectedRowCount={table.getSelectedRowModel().rows.length}
			onClearSelected={() => table.toggleAllRowsSelected(false)}
			disabled={!canEdit}
			loading={isFetching && !databases.length}
		>
			<DataTable<Database> table={table} />
		</VersionTabLayout>
	);
}
