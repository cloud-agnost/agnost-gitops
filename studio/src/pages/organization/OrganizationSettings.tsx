import { ORGANIZATION_SETTINGS } from '@/constants';
import { SettingsNavbar } from '@/features/version/SettingsNavbar';
import { SettingsLayout } from '@/layouts/SettingsLayout';
import { RequireAuth } from '@/router';
import useOrganizationStore from '@/store/organization/organizationStore';
import { Outlet } from 'react-router-dom';

export default function OrganizationSettings() {
	const { organization } = useOrganizationStore();
	const settings = ORGANIZATION_SETTINGS.map((setting) => ({
		...setting,
		href: setting.href.replace(':id', organization?._id as string),
	}));
	return (
		<SettingsLayout
			navbar={<SettingsNavbar items={settings} />}
			className='!full-height-without-header-and-menu'
		>
			<RequireAuth>
				<Outlet />
			</RequireAuth>
		</SettingsLayout>
	);
}
