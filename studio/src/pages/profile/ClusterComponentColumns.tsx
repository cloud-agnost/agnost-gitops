import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { RESOURCE_ICON_MAP } from '@/constants';
import useClusterStore from '@/store/cluster/clusterStore';
import { ClusterComponent, ColumnDefWithClassName } from '@/types';
import { translate } from '@/utils';
import { PencilSimple } from '@phosphor-icons/react';

const { openEditClusterComponent } = useClusterStore.getState();

const ClusterComponentColumns: ColumnDefWithClassName<ClusterComponent>[] = [
	{
		accessorKey: 'title',
		header: translate('general.name'),
	},
	{
		accessorKey: 'type',
		header: translate('general.type'),
		cell: ({ row }) => {
			const { type } = row.original;
			const Icon = RESOURCE_ICON_MAP[type];
			return (
				<div className='flex items-center space-x-2'>
					<Icon className='w-6 h-6' />
					<span className='text-sm text-default'>{type}</span>
				</div>
			);
		},
	},
	{
		accessorKey: 'status',
		header: translate('cluster.k8sType'),
		cell: ({ row }) => {
			const { k8sType } = row.original;
			return <Badge variant={k8sType === 'Deployment' ? 'blue' : 'orange'} text={k8sType} />;
		},
	},
	{
		accessorKey: 'info.version',
		header: translate('general.version'),
		cell: ({ row }) => (
			<div className='text-sm text-default truncate'>{row.original.info?.version}</div>
		),
	},
	{
		accessorKey: 'info.runningReplicas',
		header: translate('cluster.running_replicas'),
		cell: ({ row }) => (
			<span className='text-sm text-default'>{row.original.info?.runningReplicas}</span>
		),
	},
	{
		accessorKey: 'info.pvcSize',
		header: translate('storage.file.size'),
		cell: ({ row }) => <span className='text-sm text-default'>{row.original.info?.pvcSize}</span>,
	},
	{
		header: translate('general.actions'),
		accessorKey: 'actions',
		cell: ({ row }) => {
			return row.original.editable ? (
				<Button
					variant='icon'
					size='sm'
					rounded
					onClick={() => openEditClusterComponent(row.original)}
				>
					<PencilSimple className='w-4 h-4' />
				</Button>
			) : null;
		},
	},
];
export default ClusterComponentColumns;
