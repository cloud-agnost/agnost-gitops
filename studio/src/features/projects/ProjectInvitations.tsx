import { Loading } from '@/components/Loading';
import { TableLoading } from '@/components/Table/Table';
import { PAGE_SIZE } from '@/constants';
import { useTable, useUpdateEffect } from '@/hooks';
import useProjectStore from '@/store/project/projectStore';
import { Invitation } from '@/types';
import { useInfiniteQuery } from '@tanstack/react-query';
import { DataTable } from 'components/DataTable';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useParams, useSearchParams } from 'react-router-dom';
import AppInvitationFilter from '../application/Settings/Invitations/AppInvitationFilter';
import { ProjectInvitationsColumns } from './Settings/ProjectInvitationsColumns';

export default function ProjectInvitations() {
	const { invitations, getProjectInvitations, lastFetchedInvitationsPage, project } =
		useProjectStore();
	const [searchParams] = useSearchParams();
	const table = useTable({
		data: invitations,
		columns: ProjectInvitationsColumns,
	});

	const { orgId } = useParams<{ orgId: string }>();

	const { fetchNextPage, isFetchingNextPage, hasNextPage, refetch, isFetching } = useInfiniteQuery({
		queryFn: ({ pageParam }) =>
			getProjectInvitations({
				page: pageParam,
				size: PAGE_SIZE,
				email: searchParams.get('e') as string,
				sortBy: searchParams.get('s') as string,
				sortDir: searchParams.get('d') as string,
				roles: searchParams.get('r')?.split(',') as string[],
				status: 'Pending',
				orgId,
				projectId: project?._id,
			}),
		queryKey: ['applicationInvitations'],
		enabled: searchParams.get('st') === 'invitations',
		initialPageParam: 0,
		refetchOnWindowFocus: false,
		getNextPageParam: (lastPage) => {
			const nextPage = lastPage.length === PAGE_SIZE ? lastFetchedInvitationsPage + 1 : undefined;
			return nextPage;
		},
	});

	useUpdateEffect(() => {
		refetch();
	}, [searchParams]);
	return (
		<div className='p-6 max-h-[85%] overflow-auto relative flex-1' id='invitation-infinite-scroll'>
			<InfiniteScroll
				scrollableTarget='invitation-infinite-scroll'
				next={fetchNextPage}
				hasMore={hasNextPage}
				loader={isFetchingNextPage && <TableLoading />}
				dataLength={invitations.length}
			>
				<div className='space-y-4'>
					<AppInvitationFilter table={table} />
					<Loading loading={isFetching && !isFetchingNextPage} />
					{!(isFetching && !isFetchingNextPage) && <DataTable<Invitation> table={table} />}
				</div>
			</InfiniteScroll>
		</div>
	);
}
