import { CopyInput } from '@/components/CopyInput';
import { SettingsFormItem } from '@/components/SettingsFormItem';
import useEnvironmentStore from '@/store/environment/environmentStore';
import { useTranslation } from 'react-i18next';
export default function EnvironmentId() {
	const { t } = useTranslation();
	const environment = useEnvironmentStore((state) => state.environment);
	return (
		<SettingsFormItem
			className='space-y-0 py-6'
			contentClassName='pt-6'
			title={t('version.environment_id')}
			description={t('version.environment_id_desc')}
		>
			<CopyInput value={environment?.iid} readOnly />
		</SettingsFormItem>
	);
}
