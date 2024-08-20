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
import { useTable } from '@/hooks';
import useEnvironmentStore from '@/store/environment/environmentStore';
import useProjectStore from '@/store/project/projectStore';
import { Project } from '@/types/project';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMatch, useParams, useSearchParams } from 'react-router-dom';
import { EnvironmentsColumns } from './EnvironmentsColumns';

export default function Environments() {
	const { t } = useTranslation();
	const { selectProject, isEnvOpen, projects, closeEnvironmentDrawer, project } = useProjectStore();
	const { getEnvironments, environments } = useEnvironmentStore();
	const [searchParams, setSearchParams] = useSearchParams();
	const match = useMatch('/organization/:orgId/projects');
	const { orgId, projectId } = useParams() as Record<string, string>;

	const filteredAndSortedEnv = useMemo(() => {
		let envs = environments;

		// Filtering
		const searchQuery = searchParams.get('ev');
		if (searchQuery) {
			const query = new RegExp(searchQuery, 'i');
			envs = envs.filter((env) => query.test(env.name));
		}

		// Sorting
		const sortKey = searchParams.get('f');
		const sortDir = searchParams.get('d');
		if (sortKey && sortDir && sortKey in envs[0]) {
			envs = [...envs].sort((a, b) => {
				if (a.name < b.name) {
					return sortDir === 'asc' ? -1 : 1;
				}
				if (a.name > b.name) {
					return sortDir === 'asc' ? 1 : -1;
				}
				return 0;
			});
		}

		return envs;
	}, [searchParams.get('ev'), searchParams.get('f'), searchParams.get('d'), environments]);
	const table = useTable({
		data: filteredAndSortedEnv,
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

	useQuery({
		queryFn: () =>
			getEnvironments({
				orgId,
				projectId: project._id,
			}),
		queryKey: ['Environments'],
		enabled: isEnvOpen,
	});

	return (
		<Drawer open={isEnvOpen} onOpenChange={closeDrawerHandler}>
			<DrawerContent position='right' size='lg'>
				<DrawerHeader>
					<DrawerTitle>{t('project.environment.title')}</DrawerTitle>
				</DrawerHeader>
				<div className='scroll' id='infinite-scroll'>
					<div className='space-y-6 p-6'>
						<SearchInput placeholder={t('project.environment.search') as string} urlKey='ev' />
						<DataTable table={table} />
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
