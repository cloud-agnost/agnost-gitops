import { DataTable } from '@/components/DataTable';
import { TableLoading } from '@/components/Table/Table';
import { MODULE_PAGE_SIZE } from '@/constants';
import ContainerColumns from '@/features/container/ContainerColumns';
import DeleteContainer from '@/features/container/DeleteContainer';
import EditContainer from '@/features/container/EditContainer';
import { useTable } from '@/hooks';
import useContainerStore from '@/store/container/containerStore';
import { Container } from '@/types';
import { useInfiniteQuery } from '@tanstack/react-query';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useParams, useSearchParams } from 'react-router-dom';

export default function ProjectEnvironmentDetail() {
	// const { t } = useTranslation();
	const { containers, getContainersInEnv, lastFetchedPage } = useContainerStore();
	const { orgId, projectId, envId } = useParams() as Record<string, string>;
	const [searchParams] = useSearchParams();
	// Todo
	// const canCreate = true;

	const table = useTable<Container>({
		data: containers,
		columns: ContainerColumns,
	});

	const { fetchNextPage, isFetchingNextPage, hasNextPage } = useInfiniteQuery({
		queryFn: ({ pageParam }) =>
			getContainersInEnv({
				orgId,
				projectId,
				envId,
				page: pageParam,
				size: MODULE_PAGE_SIZE,
				search: searchParams.get('q') as string,
				sortBy: searchParams.get('f') as string,
				sortDir: searchParams.get('d') as string,
			}),
		initialPageParam: 0,
		queryKey: ['projectEnvironments'],
		enabled:
			lastFetchedPage === undefined ||
			Math.ceil(containers.length / MODULE_PAGE_SIZE) < (lastFetchedPage ?? 0),
		getNextPageParam: (lastPage) => {
			const nextPage =
				lastPage?.length === MODULE_PAGE_SIZE ? (lastFetchedPage ?? 0) + 1 : undefined;
			return nextPage;
		},
	});
	return (
		<>
			{/* //TODO <VersionTabLayout
				searchable
				type={TabTypes.Container}
				title={t('project.containers') as string}
				isEmpty={!containers.length}
				onMultipleDelete={() => {}}
				disabled={!canCreate}
				loading={isFetching && !containers.length}
				selectedRowCount={table.getSelectedRowModel().rows.length}
				onClearSelected={() => table.toggleAllRowsSelected(false)}
				handlerButton={<CreateContainerButton />}
			>
				
			</VersionTabLayout> */}
			<InfiniteScroll
				scrollableTarget='env-layout'
				dataLength={containers.length}
				next={fetchNextPage}
				hasMore={hasNextPage}
				loader={isFetchingNextPage && <TableLoading />}
			>
				<DataTable table={table} />
			</InfiniteScroll>
			<EditContainer />
			<DeleteContainer />
		</>
	);
}
