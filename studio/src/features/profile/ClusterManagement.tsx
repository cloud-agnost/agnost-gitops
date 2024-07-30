import { CopyInput } from '@/components/CopyInput';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { SettingsFormItem } from '@/components/SettingsFormItem';
import useClusterStore from '@/store/cluster/clusterStore';
import { DialogProps } from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import CustomDomains from '../cluster/CustomDomain/CustomDomains';
import ReverseProxyURL from '../cluster/CustomDomain/ReverseProxyURL';
import TransferClusterOwnership from './TransferClusterOwnership';

export default function ClusterManagement(props: DialogProps) {
	const { t } = useTranslation();
	const { checkDomainStatus, clusterDomainError, cluster } = useClusterStore();

	useQuery({
		queryFn: checkDomainStatus,
		queryKey: ['checkDomainStatus'],
		retry: false,
		enabled: _.isNil(clusterDomainError),
	});

	return (
		<Drawer {...props}>
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
