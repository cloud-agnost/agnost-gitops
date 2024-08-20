import { Alert, AlertDescription, AlertTitle } from '@/components/Alert';
import { DataTable } from '@/components/DataTable';
import { Loading } from '@/components/Loading';
import { useTable } from '@/hooks';
import { ClusterService } from '@/services';
import { ClusterStorageInfo, ColumnDefWithClassName } from '@/types';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';

export default function ClusterManagementUsage() {
	const { data, isFetching, error } = useQuery({
		queryFn: ClusterService.getClusterStorageInfo,
		queryKey: ['getClusterStorageInfo'],
		refetchOnWindowFocus: false,
		retry: false,
	});

	const table = useTable<ClusterStorageInfo>({
		columns: ClusterManagementUsageColumns,
		data: data || [],
	});

	if (isFetching) {
		return <Loading loading={isFetching} />;
	}
	return (
		<div className='p-6'>
			{!_.isNil(error) ? (
				<Alert variant='warning'>
					<AlertTitle>Cannot get storage usage information from the cluster</AlertTitle>
					<AlertDescription>{error.message}</AlertDescription>
				</Alert>
			) : (
				<DataTable table={table} />
			)}
		</div>
	);
}

const ClusterManagementUsageColumns: ColumnDefWithClassName<ClusterStorageInfo>[] = [
	{
		id: 'component',
		header: 'Component',
		accessorKey: 'containerName',
	},
	{
		id: 'size',
		header: 'Size',
		accessorKey: 'size',
	},
	{
		id: 'used',
		header: 'Used',
		accessorKey: 'used',
	},
	{
		id: 'available',
		header: 'Available',
		accessorKey: 'available',
	},
	{
		id: 'percentage',
		header: 'Percentage (%)',
		accessorKey: 'usedPercentage',
	},
];
