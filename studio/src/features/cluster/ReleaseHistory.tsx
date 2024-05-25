import { DataTable } from '@/components/DataTable';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { useTable } from '@/hooks';
import useClusterStore from '@/store/cluster/clusterStore';
import { useTranslation } from 'react-i18next';
import ReleaseHistoryColumns from './ReleaseHistoryColumns';

export default function ReleaseHistory() {
	const { t } = useTranslation();
	const { clusterReleaseInfo, isReleaseHistoryOpen, toggleReleaseHistory } = useClusterStore();

	const table = useTable({
		columns: ReleaseHistoryColumns,
		data: clusterReleaseInfo?.cluster?.releaseHistory ?? [],
	});
	return (
		<Drawer open={isReleaseHistoryOpen} onOpenChange={toggleReleaseHistory}>
			<DrawerContent position='right' size='lg' className='h-full'>
				<DrawerHeader>
					<DrawerTitle>{t('cluster.history')}</DrawerTitle>
				</DrawerHeader>
				<div className='p-6 scroll'>
					<DataTable table={table} />
				</div>
			</DrawerContent>
		</Drawer>
	);
}
