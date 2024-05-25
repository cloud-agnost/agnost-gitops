import { SettingsFormItem } from '@/components/SettingsFormItem';
import useEnvironmentStore from '@/store/environment/environmentStore';
import { useTranslation } from 'react-i18next';
import { SuspendButton } from '../SuspendButton';

export default function EnvironmentStatusToggle() {
	const { t } = useTranslation();
	const environment = useEnvironmentStore((state) => state.environment);

	return (
		<SettingsFormItem
			className='space-y-0 py-6'
			contentClassName='pt-6'
			title={
				environment?.suspended ? t('version.reactivate_services') : t('version.suspend_services')
			}
			description={
				environment?.suspended
					? t('version.reactivate_services_desc')
					: t('version.suspend_services_desc')
			}
		>
			<SuspendButton />
		</SettingsFormItem>
	);
}
