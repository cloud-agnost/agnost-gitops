import { DataTable } from '@/components/DataTable';
import { TableLoading } from '@/components/Table/Table';
import { CacheColumns } from '@/features/cache';
import { useInfiniteScroll, useTable, useToast } from '@/hooks';
import useAuthorizeVersion from '@/hooks/useAuthorizeVersion';
import { VersionTabLayout } from '@/layouts/VersionLayout';
import useCacheStore from '@/store/cache/cacheStore';
import { APIError, Cache, TabTypes } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { Row } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useParams } from 'react-router-dom';

export default function VersionCache() {
	const canCreateCache = useAuthorizeVersion('cache.create');
	const { toast } = useToast();
	const { t } = useTranslation();
	const { versionId, orgId, appId } = useParams();
	const { getCaches, deleteMultipleCache, toggleCreateModal, lastFetchedPage, caches } =
		useCacheStore();
	const table = useTable({
		data: caches,
		columns: CacheColumns,
	});
	const { fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } = useInfiniteScroll({
		queryFn: getCaches,
		lastFetchedPage,
		dataLength: caches.length,
		queryKey: 'caches',
	});

	const { mutateAsync: deleteMultipleCacheMutation } = useMutation({
		mutationFn: deleteMultipleCache,
		onSuccess: () => {
			table?.resetRowSelection();
		},
		onError: ({ details }: APIError) => {
			toast({ action: 'error', title: details });
		},
	});

	function deleteMultipleCachesHandler() {
		deleteMultipleCacheMutation({
			cacheIds: table
				?.getSelectedRowModel()
				.rows.map((row: Row<Cache>) => row.original._id) as string[],
			orgId: orgId as string,
			appId: appId as string,
			versionId: versionId as string,
		});
	}

	return (
		<VersionTabLayout
			searchable
			isEmpty={caches.length === 0}
			title={t('cache.title') as string}
			type={TabTypes.Cache}
			openCreateModal={toggleCreateModal}
			selectedRowCount={table.getSelectedRowModel().rows.length}
			onClearSelected={() => table.toggleAllRowsSelected(false)}
			onMultipleDelete={deleteMultipleCachesHandler}
			disabled={!canCreateCache}
			loading={isFetching && !caches.length}
		>
			<InfiniteScroll
				scrollableTarget='version-layout'
				dataLength={caches.length}
				next={fetchNextPage}
				hasMore={hasNextPage}
				loader={isFetchingNextPage && <TableLoading />}
			>
				<DataTable<Cache> table={table} />
			</InfiniteScroll>
		</VersionTabLayout>
	);
}
