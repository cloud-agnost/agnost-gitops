import { Notifications } from '@/features/auth/Notifications';
import { SettingsContainer } from '@/features/version/SettingsContainer';
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
