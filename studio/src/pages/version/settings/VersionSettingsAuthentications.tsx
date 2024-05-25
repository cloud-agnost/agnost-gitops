import { OrganizationMenuItem } from '@/features/organization';
import { SettingsContainer } from '@/features/version/SettingsContainer';
import {
	EmailAuthentication,
	MessageTemplates,
	PhoneAuthentication,
	RedirectURLs,
	SelectOAuthProviders,
	SelectUserDataModel,
} from '@/features/version/authentication';
import { handleTabChange } from '@/utils';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
enum AUTH_TABS {
	GENERAL = 'general',
	PROVIDERS = 'providers',
	TEMPLATES = 'templates',
}

export default function VersionSettingsAuthentications() {
	const [searchParams] = useSearchParams();
	const { t } = useTranslation();
	const AUTH_MENU_ITEMS = [
		{
			name: t('version.settings.general'),
			href: 'general',
		},
		{
			name: t('version.authentication.providers'),
			href: 'providers',
		},
		{
			name: t('version.authentication.message_templates'),
			href: 'templates',
		},
	];

	return (
		<SettingsContainer pageTitle={t('version.settings.authentications')}>
			<div className='h-full'>
				<nav className='flex border-b'>
					{AUTH_MENU_ITEMS.map((item) => (
						<OrganizationMenuItem
							key={item.name}
							item={item}
							active={window.location.search.includes(item.href)}
							onClick={() => {
								handleTabChange(
									t('version.settings.authentications'),
									`settings/authentications?t=${item.href}`,
								);
							}}
						/>
					))}
				</nav>
				<div className='scroll space-y-8 p-6'>
					{searchParams.get('t') === AUTH_TABS.GENERAL && (
						<>
							<SelectUserDataModel />
							<RedirectURLs />
							<EmailAuthentication />
							<PhoneAuthentication />
						</>
					)}
					{searchParams.get('t') === AUTH_TABS.PROVIDERS && <SelectOAuthProviders />}
					{searchParams.get('t') === AUTH_TABS.TEMPLATES && <MessageTemplates />}
				</div>
			</div>
		</SettingsContainer>
	);
}
