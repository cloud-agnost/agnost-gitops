import { MENU_ITEMS_FOR_PROFILE_SETTINGS } from '@/constants';
import { SettingsNavbar } from '@/features/version/SettingsNavbar';
import { Layout } from '@/layouts/Layout';
import { SettingsLayout } from '@/layouts/SettingsLayout';
import { RequireAuth } from '@/router';
import useAuthStore from '@/store/auth/authStore';
import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';

export default function ProfileSettings() {
	const user = useAuthStore((state) => state.user);
	const settings = useMemo(() => {
		return MENU_ITEMS_FOR_PROFILE_SETTINGS.filter(
			(item) => !item.href.includes('cluster') || user?.isClusterOwner,
		);
	}, [user?.isClusterOwner]);

	return (
		<Layout>
			<SettingsLayout
				navbar={<SettingsNavbar items={settings} />}
				className='full-height-without-header'
			>
				<RequireAuth>
					<Outlet />
				</RequireAuth>
			</SettingsLayout>
		</Layout>
	);
}
