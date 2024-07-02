import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import useClusterStore from '@/store/cluster/clusterStore';
import { useTranslation } from 'react-i18next';
import EditClusterConfig from './EditClusterConfig';
import EditClusterReplicas from './EditClusterReplicas';

export default function EditClusterComponent() {
	const { t } = useTranslation();

	const { isEditClusterComponentOpen, clusterComponent, closeEditClusterComponent } =
		useClusterStore();

	function closeDrawer() {
		closeEditClusterComponent();
	}

	return (
		<Drawer open={isEditClusterComponentOpen} onOpenChange={closeDrawer}>
			<DrawerContent position='right' size='lg' className='h-full'>
				<DrawerHeader>
					<DrawerTitle>{t('cluster.editClusterComponent')}</DrawerTitle>
				</DrawerHeader>
				{clusterComponent.info?.pvcSize ? <EditClusterConfig /> : <EditClusterReplicas />}
			</DrawerContent>
		</Drawer>
	);
}
