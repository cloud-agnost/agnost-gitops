import { SettingsContainer } from '@/features/version/SettingsContainer';
import { AutoDeploy, Redeploy, Restart } from '@/features/version/SettingsEnvironment';
import EnvironmentId from '@/features/version/SettingsEnvironment/EnvironmentId';
import EnvironmentStatusToggle from '@/features/version/SettingsEnvironment/EnvironmentStatusToggle';
import UpdateAPIServer from '@/features/version/SettingsEnvironment/UpdateAPIServer';
import { useTranslation } from 'react-i18next';

export default function VersionSettingsEnvironment() {
	const { t } = useTranslation();

	return (
		<SettingsContainer pageTitle={t('version.settings.environment')}>
			<div className='divide-y'>
				<Redeploy />
				<Restart />
				<AutoDeploy />
				<EnvironmentId />
				<UpdateAPIServer />
				<EnvironmentStatusToggle />
			</div>
		</SettingsContainer>
	);
}
