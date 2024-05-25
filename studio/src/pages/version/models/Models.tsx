import { Button } from '@/components/Button';
import { ModelColumns } from '@/features/database/models';
import { useSearch, useTabNavigate, useTable, useToast, useUpdateEffect } from '@/hooks';
import useAuthorizeVersion from '@/hooks/useAuthorizeVersion.tsx';
import { VersionTabLayout } from '@/layouts/VersionLayout';
import useApplicationStore from '@/store/app/applicationStore';
import useDatabaseStore from '@/store/database/databaseStore.ts';
import useModelStore from '@/store/database/modelStore.ts';
import useVersionStore from '@/store/version/versionStore';
import { APIError, Model, TabTypes } from '@/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { BreadCrumb, BreadCrumbItem } from 'components/BreadCrumb';
import { DataTable } from 'components/DataTable';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
export default function Models() {
	const { application } = useApplicationStore();
	const { version } = useVersionStore();
	const { getModelsOfSelectedDb, deleteMultipleModel, getModels, toggleCreateModal } =
		useModelStore();
	const { t } = useTranslation();
	const { toast } = useToast();
	const canCreateModel = useAuthorizeVersion('model.create');
	const { dbId, orgId, appId, versionId } = useParams() as {
		dbId: string;
		orgId: string;
		appId: string;
		versionId: string;
	};
	const models = getModelsOfSelectedDb(dbId);
	const { database } = useDatabaseStore();
	const navigate = useTabNavigate();
	const filteredModels = useSearch(models as Model[]);
	const table = useTable<Model>({
		data: filteredModels,
		columns: ModelColumns,
	});

	const { isFetching, refetch } = useQuery({
		queryFn: () =>
			getModels({
				dbId: database._id,
				orgId,
				appId: application?._id ?? appId,
				versionId: version?._id ?? versionId,
			}),
		queryKey: ['getModels', database._id, orgId, application?._id, appId, version?._id, versionId],
		refetchOnWindowFocus: false,
		enabled: !_.isNil(database) && models?.[0]?.dbId !== dbId,
	});
	const { mutateAsync: deleteMultipleModelMutation } = useMutation({
		mutationFn: deleteMultipleModel,
		mutationKey: ['deleteMultipleModel'],
		onSuccess: () => {
			table?.resetRowSelection();
		},
		onError: (error: APIError) => {
			toast({
				title: error.details,
				action: 'error',
			});
		},
	});

	async function deleteMultipleModelHandler() {
		deleteMultipleModelMutation({
			dbId: database._id,
			versionId: database.versionId,
			appId: database.appId,
			orgId: database.orgId,
			modelIds: table.getSelectedRowModel().rows.map((row) => row.original._id),
		});
	}

	const databasesUrl = `/organization/${database?.orgId}/apps/${database?.appId}/version/${database?.versionId}/database`;

	const breadcrumbItems: BreadCrumbItem[] = [
		{
			name: t('database.page_title').toString(),
			url: databasesUrl,
		},
		{
			name: database?.name,
		},
	];

	function handleViewDataClick() {
		navigate({
			title: `${t('database.navigator.title')} - ${database.name} `,
			path: `${databasesUrl}/${database._id}/navigator/${models?.[0]._id}`,
			isActive: true,
			isDashboard: false,
			type: TabTypes.Navigator,
		});
	}

	useUpdateEffect(() => {
		refetch();
	}, [dbId, orgId, appId, versionId]);
	return (
		<VersionTabLayout
			breadCrumb={<BreadCrumb items={breadcrumbItems} />}
			isEmpty={!filteredModels.length}
			type={TabTypes.Model}
			openCreateModal={toggleCreateModal}
			selectedRowCount={table.getSelectedRowModel().rows.length}
			onClearSelected={() => table.toggleAllRowsSelected(false)}
			disabled={!canCreateModel}
			onMultipleDelete={deleteMultipleModelHandler}
			loading={isFetching}
			searchable
			handlerButton={
				models &&
				models.length > 0 && (
					<Button variant='secondary' onClick={handleViewDataClick}>
						View Data
					</Button>
				)
			}
		>
			<DataTable<Model> table={table} />
		</VersionTabLayout>
	);
}
