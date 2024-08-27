import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { SettingsFormItem } from '@/components/SettingsFormItem';
import { EDIT_PROJECT_MENU_ITEMS } from '@/constants';
import {
	ChangeOrganizationAvatar,
	ChangeOrganizationName,
	DeleteOrganization,
	OrganizationInvitations,
	OrganizationMembers,
	OrganizationMenuItem,
	TransferOrganization,
} from '@/features/organization';
import useOrganizationStore from '@/store/organization/organizationStore';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
export default function OrganizationSettings() {
	const { t } = useTranslation();
	const [searchParams, setSearchParams] = useSearchParams();
	const { isOrganizationSettingsOpen, toggleOrganizationSettings } = useOrganizationStore();

	function onOpenChangeHandler() {
		toggleOrganizationSettings();
		searchParams.delete('ot');
		setSearchParams(searchParams);
	}

	return (
		<Drawer open={isOrganizationSettingsOpen} onOpenChange={onOpenChangeHandler}>
			<DrawerContent position='right' size='lg' className='h-full'>
				<DrawerHeader className='border-none'>
					<DrawerTitle>{t('organization.settings.title')}</DrawerTitle>
				</DrawerHeader>
				<nav className='flex border-b'>
					{EDIT_PROJECT_MENU_ITEMS.map((item) => {
						return (
							<OrganizationMenuItem
								key={item.name}
								item={item}
								active={searchParams.get('ot') === item.href}
								urlKey='ot'
							/>
						);
					})}
				</nav>
				<div className='flex flex-col h-full p-6 scroll'>
					{searchParams.get('ot') === 'general' && <GeneralSettings />}
					{searchParams.get('ot') === 'members' && <OrganizationMembers />}
					{searchParams.get('ot') === 'invitations' && <OrganizationInvitations />}
				</div>
			</DrawerContent>
		</Drawer>
	);
}

function GeneralSettings() {
	const { t } = useTranslation();
	const ORGANIZATION_GENERAL_SETTINGS = [
		{
			title: t('organization.settings.name.title'),
			description: t('organization.settings.name.desc'),
			component: <ChangeOrganizationName />,
		},
		{
			title: t('organization.settings.avatar.title'),
			description: t('organization.settings.avatar.desc'),
			component: <ChangeOrganizationAvatar />,
		},
		{
			title: t('organization.settings.transfer.title'),
			description: t('organization.settings.transfer.desc'),
			component: <TransferOrganization />,
		},
		{
			title: t('organization.settings.delete.title'),
			description: t('organization.settings.delete.desc'),
			component: <DeleteOrganization />,
		},
	];
	return (
		<div className='divide-y'>
			{ORGANIZATION_GENERAL_SETTINGS.map((item) => (
				<SettingsFormItem
					key={item.title}
					title={item.title}
					description={item.description}
					className='py-6 first-of-type:pt-0 last-of-type:pb-0'
				>
					{item.component}
				</SettingsFormItem>
			))}
		</div>
	);
}
