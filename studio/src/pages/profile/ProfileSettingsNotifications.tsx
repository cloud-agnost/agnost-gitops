import { SettingsContainer } from '@/components/SettingsContainer';
import { Notifications } from '@/features/auth/Notifications';
import { useTranslation } from 'react-i18next';

export default function ProfileSettingsNotifications() {
	const { t } = useTranslation();
	return (
		<SettingsContainer
			pageTitle={t('profileSettings.notifications_title')}
			description={t('profileSettings.notifications_description')}
		>
			<Notifications />
		</SettingsContainer>
	);
}
