import { SettingsFormItem } from '@/components/SettingsFormItem';
import useEnvironmentStore from '@/store/environment/environmentStore';
import { DATETIME_MED, formatDate } from '@/utils';
import { t } from 'i18next';
import { DeployButton } from '../DeployButton';

export default function Redeploy() {
	const environment = useEnvironmentStore((state) => state.environment);
	return (
		<SettingsFormItem
			className='space-y-0 pb-6 pt-0'
			contentClassName='flex items-center justify-end'
			twoColumns
			description={
				environment?.deploymentDtm &&
				`Last deployment at: ${formatDate(environment?.deploymentDtm, DATETIME_MED)}`
			}
			title={t('version.redeploy')}
		>
			<DeployButton />
		</SettingsFormItem>
	);
}
