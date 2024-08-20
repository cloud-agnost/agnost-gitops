import { CopyInput } from '@/components/CopyInput';
import { SettingsFormItem } from '@/components/SettingsFormItem';
import useClusterStore from '@/store/cluster/clusterStore';
import { useTranslation } from 'react-i18next';
import CustomDomains from '../cluster/CustomDomain/CustomDomains';
import ReverseProxyURL from '../cluster/CustomDomain/ReverseProxyURL';
import TransferClusterOwnership from './TransferClusterOwnership';
export default function ClusterManagementGeneral() {
	const { t } = useTranslation();
	const { cluster } = useClusterStore();
	return (
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
	);
}
