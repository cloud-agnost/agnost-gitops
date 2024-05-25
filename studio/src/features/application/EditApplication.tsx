import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { EDIT_APPLICATION_MENU_ITEMS } from '@/constants';
import AppInvitations from '@/features/application/Settings/Invitations/AppInvitations';
import OrganizationMenuItem from '@/features/organization/navbar/OrganizationMenuItem';
import useApplicationStore from '@/store/app/applicationStore';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMatch, useParams, useSearchParams } from 'react-router-dom';
import AppGeneralSettings from './Settings/AppGeneralSettings';
import AppMembers from './Settings/Members/AppMembers';
import { useQuery } from '@tanstack/react-query';

export default function EditApplication() {
	const { t } = useTranslation();
	const [searchParams, setSearchParams] = useSearchParams();
	const { isEditAppOpen, application, closeEditAppDrawer, getAppTeamMembers } =
		useApplicationStore();
	const match = useMatch('/organization/:orgId/apps');
	const { orgId } = useParams() as Record<string, string>;
	useEffect(() => {
		if (isEditAppOpen && !searchParams.get('st')) {
			searchParams.set('st', 'general');
			setSearchParams(searchParams);
		}
	}, [isEditAppOpen, searchParams]);

	useEffect(() => {
		if (!isEditAppOpen) {
			searchParams.delete('st');
			setSearchParams(searchParams);
		}
	}, [isEditAppOpen]);

	const { isPending } = useQuery({
		queryFn: () =>
			getAppTeamMembers({
				appId: application?._id as string,
				orgId,
			}),
		queryKey: ['appTeamMembers'],
		enabled: isEditAppOpen,
	});

	return (
		<Drawer open={isEditAppOpen} onOpenChange={() => closeEditAppDrawer(!!match)}>
			<DrawerContent position='right' size='lg' className='h-full'>
				<DrawerHeader className='border-none'>
					<DrawerTitle>{t('application.settings.editApp')}</DrawerTitle>
				</DrawerHeader>
				<nav className='flex border-b'>
					{EDIT_APPLICATION_MENU_ITEMS.map((item) => {
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
					{searchParams.get('st') === 'general' && <AppGeneralSettings />}
					{searchParams.get('st') === 'members' && <AppMembers loading={isPending} />}
					{searchParams.get('st') === 'invitations' && <AppInvitations />}
				</div>
			</DrawerContent>
		</Drawer>
	);
}
