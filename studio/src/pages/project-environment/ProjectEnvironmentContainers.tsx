import { DataTable } from '@/components/DataTable';
import { TableLoading } from '@/components/Table/Table';
import ContainerColumns from '@/features/container/ContainerColumns';
import CreateContainerButton from '@/features/container/CreateContainerButton';
import DeleteContainer from '@/features/container/DeleteContainer';
import EditContainer from '@/features/container/EditContainer';
import { useInfiniteScroll, useTable } from '@/hooks';
import { VersionTabLayout } from '@/layouts/VersionLayout';
import useContainerStore from '@/store/container/containerStore';
import { TabTypes } from '@/types';
import { Container } from '@/types/container';
import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useParams, useSearchParams } from 'react-router-dom';

export default function ProjectEnvironmentDetail() {
	const { t } = useTranslation();
	const { containers, getContainersInEnv, lastFetchedPage } = useContainerStore();
	const { orgId, projectId, envId } = useParams() as Record<string, string>;
	const [searchParams] = useSearchParams();
	// Todo
	const canCreate = true;

	const table = useTable<Container>({
		data: containers,
		columns: ContainerColumns,
	});

	const { fetchNextPage, isFetchingNextPage, hasNextPage, isFetching } = useInfiniteScroll({
		queryFn: getContainersInEnv,
		queryKey: 'getContainersInEnv',
		lastFetchedPage,
		dataLength: containers.length,
		disableVersionParams: true,
		params: {
			orgId,
			projectId,
			envId,
			search: searchParams.get('q') ?? '',
		},
	});
	return (
		<>
			<VersionTabLayout
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
				<InfiniteScroll
					scrollableTarget='env-layout'
					dataLength={containers.length}
					next={fetchNextPage}
					hasMore={hasNextPage}
					loader={isFetchingNextPage && <TableLoading />}
				>
					<DataTable table={table} />
				</InfiniteScroll>
			</VersionTabLayout>
			<EditContainer />
			<DeleteContainer />
		</>
	);
}
