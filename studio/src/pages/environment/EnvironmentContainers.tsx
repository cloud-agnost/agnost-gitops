import { Button } from '@/components/Button';
import { DataTable } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { Loading } from '@/components/Loading';
import { SearchInput } from '@/components/SearchInput';
import { TableLoading } from '@/components/Table/Table';
import { MODULE_PAGE_SIZE } from '@/constants';
import ContainerColumns from '@/features/container/ContainerColumns';
import CreateContainerButton from '@/features/container/CreateContainerButton';
import DeleteContainer from '@/features/container/DeleteContainer';
import EditContainer from '@/features/container/EditContainer';
import { useTable } from '@/hooks';
import useContainerStore from '@/store/container/containerStore';
import { Container } from '@/types';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useParams, useSearchParams } from 'react-router-dom';

export default function EnvironmentContainers() {
	const { t } = useTranslation();
	const { containers, getContainersInEnv, lastFetchedPage } = useContainerStore();
	const { orgId, projectId, envId } = useParams() as Record<string, string>;
	const [searchParams, setSearchParams] = useSearchParams();
	// Todo const canCreate = true;
	const table = useTable<Container>({
		data: containers,
		columns: ContainerColumns,
	});

	function onClearHandler() {
		searchParams.delete('q');
		setSearchParams(searchParams);
	}

	const { fetchNextPage, isFetchingNextPage, hasNextPage, isFetching, refetch } = useInfiniteQuery({
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
		queryKey: [
			'Environments',
			orgId,
			projectId,
			envId,
			searchParams.get('q'),
			searchParams.get('f'),
			searchParams.get('d'),
		],
		enabled:
			lastFetchedPage === undefined ||
			Math.ceil(containers.length / MODULE_PAGE_SIZE) < (lastFetchedPage ?? 0),
		getNextPageParam: (lastPage) => {
			const nextPage =
				lastPage?.length === MODULE_PAGE_SIZE ? (lastFetchedPage ?? 0) + 1 : undefined;
			return nextPage;
		},
	});

	useEffect(() => {
		refetch();
	}, [
		envId,
		orgId,
		projectId,
		searchParams.get('q'),
		searchParams.get('f'),
		searchParams.get('d'),
	]);
	if (!containers.length && !isFetching) {
		return (
			<EmptyState
				type='container'
				title={
					searchParams.has('q')
						? t('general.no_result')
						: t('general.module_empty', {
								module: 'container',
						  })
				}
			>
				{searchParams.has('q') ? (
					<Button className='btn btn-primary' onClick={onClearHandler}>
						{t('general.reset_search_query')}
					</Button>
				) : (
					<CreateContainerButton />
				)}
			</EmptyState>
		);
	}
	return (
		<>
			<div className='h-full space-y-4 p-4'>
				<div className='space-y-4'>
					<div className='flex items-center justify-between flex-1'>
						<h1 className='text-default text-sm text-center font-semibold'>
							{t('project.containers')}
						</h1>
						<div className='flex items-center justify-center gap-2'>
							<SearchInput
								value={searchParams.get('q') ?? undefined}
								className='sm:w-[450px] flex-1'
							/>

							<CreateContainerButton />
						</div>
					</div>
				</div>
				<div className='h-[calc(100%-2.5rem)]'>
					{!isFetching && (
						<InfiniteScroll
							scrollableTarget='env-layout'
							dataLength={containers.length}
							next={fetchNextPage}
							hasMore={hasNextPage}
							loader={isFetchingNextPage && <TableLoading />}
						>
							<DataTable table={table} />
						</InfiniteScroll>
					)}
				</div>
				<Loading loading={isFetching} />
			</div>
			<EditContainer />
			<DeleteContainer />
		</>
	);
}
