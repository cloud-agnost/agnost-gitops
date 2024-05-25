import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import useResourceStore from '@/store/resources/resourceStore';
import { useTranslation } from 'react-i18next';
import { CreateResource, ConnectResource } from '@/features/resources';
import { ResourceCreateType } from '@/types';
export default function AddResourceDrawer() {
	const { t } = useTranslation();

	const { isCreateResourceModalOpen, toggleCreateResourceModal, resourceConfig } =
		useResourceStore();

	return (
		<Drawer open={isCreateResourceModalOpen} onOpenChange={toggleCreateResourceModal}>
			<DrawerContent position='right' size='lg'>
				<DrawerHeader>
					<DrawerTitle>{t('resources.add')}</DrawerTitle>
				</DrawerHeader>
				<div className='scroll px-4 py-6'>
					{resourceConfig.type === ResourceCreateType.New ? (
						<CreateResource />
					) : (
						<ConnectResource />
					)}
				</div>
			</DrawerContent>
		</Drawer>
	);
}
