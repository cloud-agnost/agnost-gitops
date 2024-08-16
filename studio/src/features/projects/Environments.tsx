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
import useEnvironmentStore from '@/store/environment/environmentStore';
import useProjectStore from '@/store/project/projectStore';
import { Project } from '@/types/project';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useMatch, useParams, useSearchParams } from 'react-router-dom';
import { EnvironmentsColumns } from './EnvironmentsColumns';

export default function Environments() {
	const { t } = useTranslation();
	const { selectProject, isEnvOpen, projects, closeEnvironmentDrawer, project } = useProjectStore();
	const { getEnvironments, environments, lastFetchedPage } = useEnvironmentStore();
	const [searchParams, setSearchParams] = useSearchParams();
	const match = useMatch('/organization/:orgId/projects');
	const { orgId, projectId } = useParams() as Record<string, string>;
	const table = useTable({
		data: environments,
		columns: EnvironmentsColumns,
	});
	function closeDrawerHandler() {
		searchParams.delete('q');
		setSearchParams(searchParams);
		console.log('closeDrawerHandler', project._id, projectId);
		if (project._id !== projectId)
			selectProject(projects.find((prj) => prj._id === projectId) as Project);
		closeEnvironmentDrawer(!!match);
	}

	const { fetchNextPage, isFetchingNextPage, hasNextPage } = useInfiniteQuery({
		queryFn: ({ pageParam }) =>
			getEnvironments({
				orgId,
				projectId: project._id,
				page: pageParam,
				size: MODULE_PAGE_SIZE,
				search: searchParams.get('q') as string,
				sortBy: searchParams.get('f') as string,
				sortDir: searchParams.get('d') as string,
				name: searchParams.get('q') as string,
			}),
		initialPageParam: 0,
		queryKey: ['Environments'],
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
