import { CopyInput } from '@/components/CopyInput';
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from '@/components/Drawer';
import { SettingsFormItem } from '@/components/SettingsFormItem';
import useClusterStore from '@/store/cluster/clusterStore';
import { cn } from '@/utils';
import { LineSegments } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import CustomDomains from '../cluster/CustomDomain/CustomDomains';
import TransferClusterOwnership from './TransferClusterOwnership';
import ReverseProxyURL from '../cluster/CustomDomain/ReverseProxyURL';

export default function ClusterManagement() {
	const { t } = useTranslation();
	const { checkDomainStatus, clusterDomainError, cluster } = useClusterStore();

	useQuery({
		queryFn: checkDomainStatus,
		queryKey: ['checkDomainStatus'],
		retry: false,
		enabled: _.isNil(clusterDomainError),
	});

	return (
		<Drawer>
			<DrawerTrigger className='dropdown-item'>
				<div className={cn('flex items-center gap-2')}>
					<LineSegments className='text-icon-base text-lg' />
					{t('profileSettings.clusters_title')}
				</div>
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>{t('profileSettings.clusters_title')}</DrawerTitle>
				</DrawerHeader>
				<div className='p-6 scroll'>
					<SettingsFormItem
						className='space-y-0 py-0 pb-6'
						contentClassName='pt-6'
						title={t('cluster.yourClusterId')}
						description={t('cluster.yourClusterIdDescription')}
					>
						<CopyInput readOnly value={cluster._id} />
					</SettingsFormItem>
					<SettingsFormItem
						className='space-y-0 py-0 pb-6'
						contentClassName='pt-6'
						title={t('cluster.transferClusterOwnership')}
						description={t('cluster.transferClusterOwnershipDescription')}
					>
						<TransferClusterOwnership />
					</SettingsFormItem>
					<SettingsFormItem
						className='space-y-0 py-0 pb-6'
						contentClassName='pt-6'
						title={t('cluster.reverseProxyURL')}
						description={t('cluster.reverseProxyURLDescription')}
					>
						<ReverseProxyURL />
					</SettingsFormItem>
					<SettingsFormItem
						className='space-y-0 py-0 pb-6'
						contentClassName='pt-6'
						title={t('cluster.custom_domain')}
						description={t('cluster.custom_domain_description')}
					>
						<CustomDomains />
					</SettingsFormItem>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
