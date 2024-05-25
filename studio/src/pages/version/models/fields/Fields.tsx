import {
	CreateFieldButton,
	EditOrCreateFieldDrawer,
	FieldColumns,
} from '@/features/database/models/fields/ListFields';
import { useSearch, useTable, useToast } from '@/hooks';
import useAuthorizeVersion from '@/hooks/useAuthorizeVersion.tsx';
import { VersionTabLayout } from '@/layouts/VersionLayout';
import useDatabaseStore from '@/store/database/databaseStore.ts';
import useModelStore from '@/store/database/modelStore.ts';
import { Field, TabTypes } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { BreadCrumb, BreadCrumbItem } from 'components/BreadCrumb';
import { DataTable } from 'components/DataTable';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
export default function Fields() {
	const { modelId, versionId, dbId, appId, orgId } = useParams() as Record<string, string>;
	const { toast } = useToast();
	const { t } = useTranslation();
	const { database } = useDatabaseStore();
	const { deleteMultipleField, model, closeEditFieldDialog, isEditFieldDialogOpen } =
		useModelStore();
	const canMultiDelete = useAuthorizeVersion('model.delete');

	const filteredFields = useSearch(model.fields);

	const table = useTable<Field>({
		data: filteredFields,
		columns: FieldColumns,
	});

	const { mutate: deleteHandler } = useMutation({
		mutationFn: () =>
			deleteMultipleField({
				modelId,
				versionId,
				dbId,
				appId,
				orgId,
				fieldIds: table.getSelectedRowModel().rows.map((row) => row.original._id),
			}),
		onSuccess: () => {
			table?.resetRowSelection?.();
		},
		onError: ({ details }) => {
			toast({ action: 'error', title: details });
		},
	});

	const databasesUrl = `/organization/${database?.orgId}/apps/${database?.appId}/version/${database?.versionId}/database`;
	const databaseUrl = `${databasesUrl}/${model?.dbId}/models`;

	const breadcrumbItems: BreadCrumbItem[] = [
		{
			name: t('database.page_title').toString(),
			url: databasesUrl,
		},
		{
			name: database?.name,
			url: databaseUrl,
		},
		{
			name: model?.name,
		},
	];

	return (
		<>
			<VersionTabLayout
				searchable
				breadCrumb={<BreadCrumb items={breadcrumbItems} />}
				isEmpty={!filteredFields.length}
				type={TabTypes.Field}
				handlerButton={<CreateFieldButton />}
				selectedRowCount={table.getSelectedRowModel().rows.length}
				onClearSelected={() => table.toggleAllRowsSelected(false)}
				disabled={!canMultiDelete}
				onMultipleDelete={deleteHandler}
				loading={!model}
			>
				<DataTable<Field> table={table} />
			</VersionTabLayout>

			<EditOrCreateFieldDrawer
				key={isEditFieldDialogOpen.toString()}
				open={isEditFieldDialogOpen}
				onOpenChange={closeEditFieldDialog}
				editMode
			/>
		</>
	);
}
