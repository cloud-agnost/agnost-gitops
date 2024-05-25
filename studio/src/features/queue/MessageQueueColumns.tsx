import { ActionsCell } from '@/components/ActionsCell';
import { TableConfirmation } from '@/components/Table';
import { TabLink } from '@/features/version/Tabs';
import { toast } from '@/hooks/useToast';
import useOrganizationStore from '@/store/organization/organizationStore';
import useMessageQueueStore from '@/store/queue/messageQueueStore';
import { APIError, ColumnDefWithClassName, MessageQueue, TabTypes } from '@/types';
import { getVersionPermission, translate } from '@/utils';
import { QueryClient } from '@tanstack/react-query';
import { Checkbox } from 'components/Checkbox';
import { SortButton } from 'components/DataTable';
import { DateText } from 'components/DateText';
import { InstanceType } from 'components/InstanceType';

const { openEditQueueModal, deleteQueue } = useMessageQueueStore.getState();
const queryClient = new QueryClient();

async function deleteHandler(mq: MessageQueue) {
	return queryClient
		.getMutationCache()
		.build(queryClient, {
			mutationFn: deleteQueue,
			onError: (error: APIError) => {
				toast({
					title: error.details,
					action: 'error',
				});
			},
		})
		.execute({
			appId: mq.appId,
			orgId: mq.orgId,
			versionId: mq.versionId,
			queueId: mq._id,
		});
}
const MessageQueueColumns: ColumnDefWithClassName<MessageQueue>[] = [
	{
		id: 'select',
		enableResizing: false,
		className: '!max-w-[25px] !w-[25px]',
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
			return <TabLink name={name} path={`${_id}`} type={TabTypes.MessageQueue} />;
		},
	},
	{
		id: 'delay',
		header: () => <SortButton text={translate('queue.delay')} field='delay' />,
		accessorKey: 'delay',
		enableSorting: true,
	},
	{
		id: 'instance',
		header: translate('general.instance'),
		accessorKey: 'iid',
		enableSorting: true,
		cell: ({
			row: {
				original: { iid },
			},
		}) => {
			return <InstanceType iid={iid} />;
		},
	},
	{
		id: 'createdAt',
		enableSorting: true,
		header: () => (
			<SortButton
				className='whitespace-nowrap'
				text={translate('general.created_at')}
				field='createdAt'
			/>
		),
		accessorKey: 'createdAt',
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
		enableSorting: true,
		sortingFn: 'datetime',
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
			return updatedBy && <DateText date={updatedAt} user={user} />;
		},
	},
	{
		id: 'actions',
		className: 'actions !w-[50px]',
		cell: ({ row: { original } }) => {
			const canEditQueue = getVersionPermission('middleware.update');
			const canDeleteQueue = getVersionPermission('middleware.delete');
			return (
				<ActionsCell<MessageQueue>
					original={original}
					canEdit={canEditQueue}
					onEdit={() => openEditQueueModal(original)}
				>
					<TableConfirmation
						align='end'
						title={translate('queue.delete.title')}
						description={translate('queue.delete.message')}
						onConfirm={() => deleteHandler(original)}
						contentClassName='m-0'
						hasPermission={canDeleteQueue}
					/>
				</ActionsCell>
			);
		},
	},
];

export default MessageQueueColumns;
