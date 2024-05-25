import { ActionsCell } from '@/components/ActionsCell';
import { TableConfirmation } from '@/components/Table';
import useFunctionStore from '@/store/function/functionStore';
import useOrganizationStore from '@/store/organization/organizationStore';
import { APIError, ColumnDefWithClassName, HelperFunction, TabTypes } from '@/types';
import { getVersionPermission, translate } from '@/utils';
import { QueryClient } from '@tanstack/react-query';
import { Checkbox } from 'components/Checkbox';
import { SortButton } from 'components/DataTable';
import { DateText } from 'components/DateText';
import { TabLink } from '../version/Tabs';
import { toast } from '@/hooks/useToast';

const { openEditFunctionModal, deleteFunction } = useFunctionStore.getState();
const queryClient = new QueryClient();

async function deleteHandler(fn: HelperFunction) {
	return queryClient
		.getMutationCache()
		.build(queryClient, {
			mutationFn: deleteFunction,
			onError: (error: APIError) => {
				toast({
					title: error.details,
					action: 'error',
				});
			},
		})
		.execute({
			appId: fn.appId,
			orgId: fn.orgId,
			versionId: fn.versionId,
			functionId: fn._id,
		});
}
const FunctionColumns: ColumnDefWithClassName<HelperFunction>[] = [
	{
		id: 'select',
		enableResizing: false,
		className: '!max-w-[10px] !w-[10px]',
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
		sortingFn: 'textCaseSensitive',
		enableSorting: true,
		cell: ({ row }) => {
			const { name, _id } = row.original;
			return <TabLink name={name} path={`${_id}`} type={TabTypes.Function} />;
		},
	},
	{
		id: 'createdAt',
		header: () => (
			<SortButton
				className='whitespace-nowrap'
				text={translate('general.created_at')}
				field='createdAt'
			/>
		),
		accessorKey: 'createdAt',
		enableSorting: true,
		size: 200,
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
		header: () => (
			<SortButton
				className='whitespace-nowrap'
				text={translate('general.updated_at')}
				field='updatedAt'
			/>
		),
		accessorKey: 'updatedAt',
		size: 200,
		enableSorting: true,
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
		className: 'actions !w-[50px]',
		cell: ({ row: { original } }) => {
			const canEditFunction = getVersionPermission('function.update');
			const canDeleteFunction = getVersionPermission('function.delete');
			return (
				<ActionsCell<HelperFunction>
					onEdit={() => openEditFunctionModal(original)}
					original={original}
					canEdit={canEditFunction}
				>
					<TableConfirmation
						align='end'
						title={translate('function.delete.title')}
						description={translate('function.delete.message')}
						onConfirm={() => deleteHandler(original)}
						contentClassName='m-0'
						hasPermission={canDeleteFunction}
					/>
				</ActionsCell>
			);
		},
	},
];

export default FunctionColumns;
