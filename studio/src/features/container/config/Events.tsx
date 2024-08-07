import { DataTable } from '@/components/DataTable';
import { Warning, SuccessCheck } from '@/components/icons';
import { useTable } from '@/hooks';
import useContainerStore from '@/store/container/containerStore';
import { ColumnDefWithClassName } from '@/types';
import { ContainerEvent } from '@/types';
import { cn } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

export default function Events() {
	const { getContainerEvents, container, containerEvents } = useContainerStore();
	const { orgId, envId, projectId } = useParams() as Record<string, string>;
	useQuery<ContainerEvent[]>({
		queryKey: ['containerEvents'],
		queryFn: () =>
			getContainerEvents({
				orgId,
				envId,
				projectId,
				containerId: container?._id!,
			}),
		refetchInterval: 3000,
	});
	const table = useTable<ContainerEvent>({
		columns: EventColumns,
		data: containerEvents || [],
	});
	return (
		<div
			className={cn(
				'table-container overflow-auto',
				containerEvents && containerEvents.length > 6 && 'h-full',
			)}
		>
			<div className='h-full'>
				<DataTable
					table={table}
					className='navigator table-fixed relative'
					headerClassName='sticky top-0 z-50'
					containerClassName='!border-none h-full'
					noDataMessage='No recent events'
				/>
			</div>
		</div>
	);
}

const EventColumns: ColumnDefWithClassName<ContainerEvent>[] = [
	{
		id: 'kind',
		header: 'Kind',
		accessorKey: 'kind',
		size: 200,
	},
	{
		id: 'message',
		header: 'Message',
		accessorKey: 'message',
		size: 300,
	},
	{
		id: 'reason',
		header: 'Reason',
		accessorKey: 'reason',
		size: 200,
		cell: ({ row }) => (
			<div className='flex items-center gap-2'>
				{row.original.type === 'Normal' ? (
					<SuccessCheck className='size-5' />
				) : (
					<Warning className='size-5' />
				)}{' '}
				{row.original.type}
			</div>
		),
	},
	{
		id: 'firstSeen',
		header: 'First Seen',
		accessorKey: 'firstSeen',
		size: 200,
		cell: ({ row }) => new Date(row.original.firstSeen).toLocaleString(),
	},
	{
		id: 'lastSeen',
		header: 'Last Seen',
		accessorKey: 'lastSeen',
		size: 200,
		cell: ({ row }) => new Date(row.original.lastSeen).toLocaleString(),
	},
	{
		id: 'count',
		header: 'Count',
		accessorKey: 'count',
	},
];
