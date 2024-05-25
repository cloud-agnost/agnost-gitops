import { ActionsCell } from '@/components/ActionsCell';
import { TabLink } from '@/features/version/Tabs';
import { toast } from '@/hooks/useToast';
import useModelStore from '@/store/database/modelStore.ts';
import useOrganizationStore from '@/store/organization/organizationStore';
import { APIError, ColumnDefWithClassName, Model, TabTypes } from '@/types';
import { getVersionPermission, translate } from '@/utils';
import { QueryClient } from '@tanstack/react-query';
import { Checkbox } from 'components/Checkbox';
import { SortButton } from 'components/DataTable';
import { DateText } from 'components/DateText';
import { TableConfirmation } from 'components/Table';

const { openEditModelModal, deleteModel } = useModelStore.getState();
const queryClient = new QueryClient();
async function deleteHandler(model: Model) {
	return queryClient
		.getMutationCache()
		.build(queryClient, {
			mutationFn: deleteModel,
			onError: (error: APIError) => {
				toast({
					title: error.details,
					action: 'error',
				});
			},
		})
		.execute({
			orgId: model.orgId,
			modelId: model._id,
			appId: model.appId,
			dbId: model.dbId,
			versionId: model.versionId,
		});
}
const ModelColumns: ColumnDefWithClassName<Model>[] = [
	{
		id: 'select',
		enableResizing: false,
		className: '!max-w-[30px] !w-[30px]',
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected()}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label='Select all'
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label='Select row'
			/>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		id: 'name',
		header: () => <SortButton text={translate('general.name')} field='name' />,
		accessorKey: 'name',
		size: 300,
		cell: ({
			row: {
				original: { _id, name },
			},
		}) => {
			return <TabLink name={name} path={`${_id}/fields`} type={TabTypes.Field} />;
		},
	},
	{
		id: 'created_at',
		size: 400,
		header: () => (
			<SortButton
				className='whitespace-nowrap'
				text={translate('general.created_at')}
				field='createdAt'
			/>
		),
		accessorKey: 'createdAt',
		enableSorting: true,
		cell: ({
			row: {
				original: { createdAt, createdBy },
			},
		}) => {
			const user = useOrganizationStore
				.getState()
				.members.find((member) => member.member._id === createdBy);

			return <DateText date={createdAt} user={user} />;
		},
	},

	{
		id: 'updatedAt',
		size: 300,
		header: () => (
			<SortButton
				className='whitespace-nowrap'
				text={translate('general.updated_at')}
				field='updatedAt'
			/>
		),
		accessorKey: 'updatedAt',
		enableSorting: true,
		sortingFn: 'datetime',
		cell: ({
			row: {
				original: { updatedAt, updatedBy },
			},
		}) => {
			if (!updatedBy) return null;
			const user = useOrganizationStore
				.getState()
				.members.find((member) => member.member._id === updatedBy);
			return updatedBy && <DateText date={updatedAt} user={user} />;
		},
	},

	{
		id: 'actions',
		className: 'actions !w-[100px]',
		cell: ({ row: { original } }) => {
			const canEditModel = getVersionPermission('model.update');
			const canDeleteModel = getVersionPermission('model.delete');
			return (
				<div className='flex items-center justify-end'>
					<ActionsCell original={original} onEdit={openEditModelModal} canEdit={canEditModel}>
						<TableConfirmation
							align='end'
							title={translate('database.models.delete.title')}
							description={translate('database.models.delete.description')}
							onConfirm={() => deleteHandler(original)}
							contentClassName='m-0'
							hasPermission={canDeleteModel}
						/>
					</ActionsCell>
				</div>
			);
		},
	},
];

export default ModelColumns;
