import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { DataTable } from '@/components/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/Dialog';
import { BADGE_COLOR_MAP } from '@/constants';
import { useTable } from '@/hooks';
import useContainerStore from '@/store/container/containerStore';
import { ColumnDefWithClassName, ContainerPod, PodCondition } from '@/types';
import { DATE_TIME_FORMAT, cn, formatDate, getRelativeTime } from '@/utils';
import { Info } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

export default function Pods() {
	const {
		getContainerPods,
		container,
		isPodInfoOpen,
		closePodInfo,
		selectedPod,
		containerPods: pods,
	} = useContainerStore();
	const { orgId, envId, projectId } = useParams() as Record<string, string>;
	useQuery<ContainerPod[]>({
		queryKey: ['containerPods'],
		queryFn: () =>
			getContainerPods({
				orgId,
				envId,
				projectId,
				containerId: container?._id!,
			}),
		refetchInterval: 3000,
	});
	const table = useTable<ContainerPod>({
		columns: PodColumns,
		data: pods ?? [],
	});
	const conditionTable = useTable<PodCondition>({
		columns: PodInfoColumns,
		data: selectedPod?.conditions || [],
	});

	return (
		<div
			className={cn('table-container overflow-auto', pods?.length! > 13 && 'h-full')}
			id='scroll'
		>
			<DataTable
				table={table}
				className='navigator w-full h-full relative'
				headerClassName='sticky top-0 z-50'
				containerClassName='!border-none h-full'
			/>
			<Dialog open={isPodInfoOpen} onOpenChange={closePodInfo}>
				<DialogContent className='sm:max-w-4xl'>
					<DialogHeader>
						<DialogTitle>{selectedPod?.name}</DialogTitle>
					</DialogHeader>
					<DataTable table={conditionTable} />
				</DialogContent>
			</Dialog>
		</div>
	);
}

const PodColumns: ColumnDefWithClassName<ContainerPod>[] = [
	{
		id: 'name',
		header: 'Name',
		accessorKey: 'name',
		enableSorting: true,
		size: 400,
	},
	{
		id: 'ready',
		header: 'Ready',
		accessorKey: 'readyContainers',
		enableSorting: true,
		cell: ({ row }) => (
			<div>
				{row.original.readyContainers}/{row.original.totalContainers}
			</div>
		),
		size: 50,
	},
	{
		id: 'status',
		header: 'Status',
		accessorKey: 'status',
		size: 100,
		cell: ({ row }) => (
			<Badge
				variant={BADGE_COLOR_MAP[row.original.status.toUpperCase()]}
				text={row.original.status}
				rounded
			/>
		),
	},
	{
		id: 'restarts',
		header: 'Restarts',
		accessorKey: 'restarts',
		size: 50,
	},
	{
		id: 'createdOn',
		header: 'Created On',
		accessorKey: 'createdOn',
		cell: ({ row }) => getRelativeTime(row.original.createdOn),
	},
	{
		id: 'actions',
		cell: ({ row }) => (
			<Button
				variant='icon'
				rounded
				size='sm'
				onClick={() => useContainerStore.getState().openPodInfo(row.original)}
			>
				<Info size={20} />
			</Button>
		),
	},
];

const PodInfoColumns: ColumnDefWithClassName<PodCondition>[] = [
	{
		id: 'lastTransitionTime',
		header: 'Last Transition Time',
		accessorKey: 'lastTransitionTime',
		cell: ({ row }) => formatDate(row.original.lastTransitionTime, DATE_TIME_FORMAT),
	},
	{
		id: 'type',
		header: 'Type',
		accessorKey: 'type',
		cell: ({ row }) => <Badge text={row.original.type} />,
	},
	{
		id: 'reason',
		header: 'Reason',
		accessorKey: 'reason',
	},
	{
		id: 'message',
		header: 'Message',
		accessorKey: 'message',
		size: 260,
	},
];
