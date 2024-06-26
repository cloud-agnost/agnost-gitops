import { SettingsContainer } from '@/components/SettingsContainer';
import { ProfileSettingsForm } from '@/features/auth/ProfileSettingsForm';
import { useTranslation } from 'react-i18next';

export default function ProfileSettingsGeneral() {
	const { t } = useTranslation();
	return (
		<SettingsContainer
			pageTitle={t('profileSettings.general_title')}
			description={t('profileSettings.general_description')}
		>
			<ProfileSettingsForm />
		</SettingsContainer>
	);
}
