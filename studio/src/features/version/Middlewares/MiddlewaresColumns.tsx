import { TabLink } from '@/features/version/Tabs';
import { toast } from '@/hooks/useToast';
import useMiddlewareStore from '@/store/middleware/middlewareStore';
import useOrganizationStore from '@/store/organization/organizationStore';
import { APIError, ColumnDefWithClassName, Middleware, TabTypes } from '@/types';
import { getVersionPermission, translate } from '@/utils';
import { QueryClient } from '@tanstack/react-query';
import { ActionsCell } from 'components/ActionsCell';
import { Checkbox } from 'components/Checkbox';
import { SortButton } from 'components/DataTable';
import { DateText } from 'components/DateText';
import { TableConfirmation } from 'components/Table';

const { openEditMiddlewareModal, deleteMiddleware } = useMiddlewareStore.getState();
const queryClient = new QueryClient();

async function deleteHandler(mw: Middleware) {
	return queryClient
		.getMutationCache()
		.build(queryClient, {
			mutationFn: deleteMiddleware,
			onError: (error: APIError) => {
				toast({
					title: error.details,
					action: 'error',
				});
			},
		})
		.execute({
			appId: mw.appId,
			orgId: mw.orgId,
			versionId: mw.versionId,
			middlewareId: mw._id,
		});
}
const MiddlewaresColumns: ColumnDefWithClassName<Middleware>[] = [
	{
		id: 'select',
		enableResizing: false,
		className: '!max-w-[15px] !w-[15px] !pr-0',
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
		enableSorting: true,
		cell: ({
			row: {
				original: { _id, name },
			},
		}) => {
			return <TabLink name={name} path={`${_id}`} type={TabTypes.Middleware} />;
		},
		accessorKey: 'name',
		sortingFn: 'textCaseSensitive',
	},
	{
		id: 'createdAt',
		header: () => <SortButton text={translate('general.created_at')} field='createdAt' />,
		accessorKey: 'createdAt',
		sortingFn: 'datetime',
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
		enableSorting: true,
		header: () => <SortButton text={translate('general.updated_at')} field='updatedAt' />,
		accessorKey: 'updatedAt',
		size: 200,
		cell: ({
			row: {
				original: { updatedAt, updatedBy },
			},
		}) => {
			if (!updatedBy) return null;
			const user = useOrganizationStore
				.getState()
				.members.find((member) => member.member._id === updatedBy);

			return <DateText date={updatedAt} user={user} />;
		},
	},
	{
		id: 'actions',
		className: 'actions',
		size: 45,
		cell: ({ row: { original } }) => {
			const canDeleteMiddleware = getVersionPermission('middleware.delete');
			const canEditMiddleware = getVersionPermission('middleware.update');
			return (
				<ActionsCell<Middleware>
					original={original}
					canEdit={canEditMiddleware}
					onEdit={() => openEditMiddlewareModal(original)}
				>
					<TableConfirmation
						align='end'
						title={translate('version.middleware.delete.title')}
						description={translate('version.middleware.delete.message')}
						onConfirm={() => deleteHandler(original)}
						contentClassName='m-0'
						hasPermission={canDeleteMiddleware}
					/>
				</ActionsCell>
			);
		},
	},
];

export default MiddlewaresColumns;
