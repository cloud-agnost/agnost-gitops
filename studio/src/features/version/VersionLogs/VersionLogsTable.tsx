import { DataTable } from '@/components/DataTable';
import { TableLoading } from '@/components/Table/Table';
import { useTable } from '@/hooks';
import useVersionStore from '@/store/version/versionStore';
import { APIError } from '@/types';
import { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import InfiniteScroll from 'react-infinite-scroll-component';
import { VersionEndpointLogColumns, VersionLogColumns } from './VersionLogColumns';

type VersionLogsTableProps = UseInfiniteQueryResult<InfiniteData<any, unknown>, APIError> & {
	type: 'queue' | 'task' | 'endpoint';
};

export default function VersionLogsTable({
	type,
	hasNextPage,
	isFetchingNextPage,
	fetchNextPage,
}: VersionLogsTableProps) {
	const { logs } = useVersionStore();

	const table = useTable({
		data: logs?.[type] ?? [],
		columns: type !== 'endpoint' ? VersionLogColumns : VersionEndpointLogColumns,
	});

	return (
		<InfiniteScroll
			scrollableTarget='version-layout'
			dataLength={logs?.[type]?.length ?? 0}
			next={fetchNextPage}
			hasMore={hasNextPage}
			loader={isFetchingNextPage && <TableLoading />}
		>
			<DataTable table={table} className='table-fixed' />
		</InfiniteScroll>
	);
}
