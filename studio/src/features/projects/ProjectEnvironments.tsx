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
import { useInfiniteScroll, useTable } from '@/hooks';
import useOrganizationStore from '@/store/organization/organizationStore';
import useProjectEnvironmentStore from '@/store/project/projectEnvironmentStore';
import useProjectStore from '@/store/project/projectStore';
import { Project } from '@/types/project';
import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useMatch, useParams, useSearchParams } from 'react-router-dom';
import { ProjectEnvironmentsColumns } from './ProjectEnvironmentsColumns';

export default function ProjectEnvironments() {
	const { t } = useTranslation();
	const { selectProject, isEnvOpen, project, projects, closeEnvironmentDrawer } = useProjectStore();
	const { organization } = useOrganizationStore();
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

	const { fetchNextPage, isFetchingNextPage, hasNextPage } = useInfiniteScroll({
		queryFn: getProjectEnvironments,
		queryKey: 'projectEnvironments',
		enabled: isEnvOpen,
		lastFetchedPage,
		dataLength: environments.length,
		disableVersionParams: true,
		params: {
			orgId: organization._id ?? orgId,
			projectId: project?._id ?? projectId,
			name: searchParams.get('q') || '',
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
