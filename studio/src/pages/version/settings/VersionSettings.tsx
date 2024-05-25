import { Outlet } from 'react-router-dom';
import { SettingsLayout } from '@/layouts/SettingsLayout';
import { SettingsNavbar } from '@/features/version/SettingsNavbar';
import { VERSION_SETTINGS_MENU_ITEMS } from 'constants/constants.ts';
import useUtilsStore from '@/store/version/utilsStore';
import { cn } from '@/utils';

export default function VersionSettings() {
	const { isSidebarOpen } = useUtilsStore();
	return (
		<SettingsLayout
			navbar={!isSidebarOpen && <SettingsNavbar items={VERSION_SETTINGS_MENU_ITEMS} />}
			className={cn('full-height-without-header-and-tab ')}
		>
			<Outlet />
		</SettingsLayout>
	);
}
