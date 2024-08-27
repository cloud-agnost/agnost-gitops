import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { EDIT_PROJECT_MENU_ITEMS } from '@/constants';
import OrganizationMenuItem from '@/features/organization/navbar/OrganizationMenuItem';
import useProjectStore from '@/store/project/projectStore';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useMatch, useParams, useSearchParams } from 'react-router-dom';
import ProjectGeneralSettings from './ProjectGeneralSettings';
import ProjectInvitations from './ProjectInvitations';
import ProjectMembers from './ProjectMembers';

export default function EditProject() {
	const { t } = useTranslation();
	const [searchParams, setSearchParams] = useSearchParams();
	const { isEditProjectOpen, closeEditProjectDrawer, getProjectTeam, project } = useProjectStore();
	const match = useMatch('/organization/:orgId/projects');
	const { orgId } = useParams() as Record<string, string>;

	function closeEditProject() {
		closeEditProjectDrawer(!!match);
		setSearchParams({});
	}

	const { isPending } = useQuery({
		queryFn: () =>
			getProjectTeam({
				projectId: project?._id as string,
				orgId,
			}),
		queryKey: ['appTeamMembers'],
		enabled: isEditProjectOpen,
		refetchOnWindowFocus: false,
	});

	return (
		<Drawer open={isEditProjectOpen} onOpenChange={closeEditProject}>
			<DrawerContent position='right' size='lg' className='h-full'>
				<DrawerHeader className='border-none'>
					<DrawerTitle>{t('project.edit_project')}</DrawerTitle>
				</DrawerHeader>
				<nav className='flex border-b'>
					{EDIT_PROJECT_MENU_ITEMS.map((item) => {
						return (
							<OrganizationMenuItem
								key={item.name}
								item={item}
								active={searchParams.get('st') === item.href}
								urlKey='st'
							/>
						);
					})}
				</nav>
				<div className='flex flex-col h-full'>
					{searchParams.get('st') === 'general' && <ProjectGeneralSettings />}
					{searchParams.get('st') === 'members' && <ProjectMembers loading={isPending} />}
					{searchParams.get('st') === 'invitations' && <ProjectInvitations />}
				</div>
			</DrawerContent>
		</Drawer>
	);
}
