import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { useTranslation } from 'react-i18next';
import OrganizationInvitation from './OrganizationInvitation';
interface OrganizationInvitationDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}
export default function OrganizationInvitationDrawer({
	open,
	onOpenChange,
}: OrganizationInvitationDrawerProps) {
	const { t } = useTranslation();
	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			<DrawerContent position='right' size='lg'>
				<DrawerHeader>
					<DrawerTitle>{t('organization.settings.members.invite.title')}</DrawerTitle>
				</DrawerHeader>
				<div className='p-6 space-y-6'>
					<OrganizationInvitation />
				</div>
			</DrawerContent>
		</Drawer>
	);
}
