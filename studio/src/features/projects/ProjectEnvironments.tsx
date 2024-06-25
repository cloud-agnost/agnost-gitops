import { Button } from '@/components/Button';
import { DataTable } from '@/components/DataTable';
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from '@/components/Drawer';
import { SearchInput } from '@/components/SearchInput';
import { TableLoading } from '@/components/Table/Table';
import { MODULE_PAGE_SIZE } from '@/constants';
import { useTable } from '@/hooks';
import useProjectEnvironmentStore from '@/store/project/projectEnvironmentStore';
import useProjectStore from '@/store/project/projectStore';
import { Project } from '@/types/project';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useMatch, useParams, useSearchParams } from 'react-router-dom';
import { ProjectEnvironmentsColumns } from './ProjectEnvironmentsColumns';

export default function ProjectEnvironments() {
	const { t } = useTranslation();
	const { selectProject, isEnvOpen, projects, closeEnvironmentDrawer } = useProjectStore();
	const { getProjectEnvironments, environments, lastFetchedPage } = useProjectEnvironmentStore();
	const [searchParams, setSearchParams] = useSearchParams();
	const match = useMatch('/organization/:orgId/projects');
	const { orgId, projectId } = useParams() as Record<string, string>;
	const table = useTable({
		data: environments,
		columns: ProjectEnvironmentsColumns,
	});
	function closeDrawerHandler() {
		searchParams.delete('q');
		setSearchParams(searchParams);
		if (projectId) selectProject(projects.find((app) => app._id === projectId) as Project);
		closeEnvironmentDrawer(!!match);
	}

	const { fetchNextPage, isFetchingNextPage, hasNextPage } = useInfiniteQuery({
		queryFn: ({ pageParam }) =>
			getProjectEnvironments({
				orgId,
				projectId,
				page: pageParam,
				size: MODULE_PAGE_SIZE,
				search: searchParams.get('q') as string,
				sortBy: searchParams.get('f') as string,
				sortDir: searchParams.get('d') as string,
				name: searchParams.get('q') as string,
			}),
		initialPageParam: 0,
		queryKey: ['projectEnvironments'],
		enabled:
			(lastFetchedPage === undefined ||
				Math.ceil(environments.length / MODULE_PAGE_SIZE) < (lastFetchedPage ?? 0)) &&
			isEnvOpen,
		getNextPageParam: (lastPage) => {
			const nextPage =
				lastPage?.length === MODULE_PAGE_SIZE ? (lastFetchedPage ?? 0) + 1 : undefined;
			return nextPage;
		},
	});
	return (
		<Drawer open={isEnvOpen} onOpenChange={closeDrawerHandler}>
			<DrawerContent position='right' size='lg'>
				<DrawerHeader>
					<DrawerTitle>{t('project.environment.title')}</DrawerTitle>
				</DrawerHeader>
				<div className='scroll' id='infinite-scroll'>
					<div className='space-y-6 p-6'>
						<SearchInput placeholder={t('project.environment.search') as string} />
						<InfiniteScroll
							scrollableTarget='infinite-scroll'
							dataLength={environments.length}
							next={fetchNextPage}
							hasMore={hasNextPage}
							loader={isFetchingNextPage && <TableLoading />}
						>
							<DataTable table={table} />
						</InfiniteScroll>
						<DrawerFooter>
							<DrawerClose asChild>
								<Button variant='secondary' size='lg'>
									{t('general.cancel')}
								</Button>
							</DrawerClose>
						</DrawerFooter>
					</div>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
