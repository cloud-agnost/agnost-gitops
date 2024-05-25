import { SettingsContainer } from '@/features/version/SettingsContainer';
import {
	BaseUrl,
	EndpointRateLimiters,
	UpdateVersionName,
	UpdateVersionVisibility,
} from '@/features/version/SettingsGeneral';
import { useTranslation } from 'react-i18next';

export default function VersionSettingsGeneral() {
	const { t } = useTranslation();
	return (
		<SettingsContainer pageTitle={t('version.settings.general')}>
			<div className='divide-y'>
				<BaseUrl />
				<UpdateVersionName />
				<UpdateVersionVisibility />
				<EndpointRateLimiters />
			</div>
		</SettingsContainer>
	);
}
