import { OrganizationMenu } from '@/features/organization';
import { Layout } from '@/layouts/Layout';
import { Outlet, useMatch } from 'react-router-dom';

export default function OrganizationDetails() {
	const isProject = useMatch('/organization/:orgId/projects/:projectId/*');
	const isApp = useMatch('/organization/:orgId/apps/:appId/*');
	const hideTabMenu = isProject || isApp;
	const isProfile = useMatch('/organization/:orgId/profile/*');
	return (
		<Layout>
			{!hideTabMenu && !isProfile && (
				<div className='org-menu-container'>
					<OrganizationMenu />
				</div>
			)}
			<Outlet />
		</Layout>
	);
}
