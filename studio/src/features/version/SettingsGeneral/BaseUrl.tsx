import { CopyInput } from '@/components/CopyInput';
import { SettingsFormItem } from '@/components/SettingsFormItem';
import useEnvironmentStore from '@/store/environment/environmentStore';
import { useTranslation } from 'react-i18next';
export default function BaseUrl() {
	const { t } = useTranslation();
	const { environment } = useEnvironmentStore();
	return (
		<SettingsFormItem
			className='space-y-0 py-0 pb-6'
			contentClassName='pt-6'
			title={t('version.settings.version_id')}
			description={t('version.settings.version_id_desc')}
		>
			<CopyInput readOnly value={`${window.location.origin}/${environment?.iid}`} />
		</SettingsFormItem>
	);
}
