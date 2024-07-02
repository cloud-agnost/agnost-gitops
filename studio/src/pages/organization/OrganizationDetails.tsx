import { Layout } from '@/layouts/Layout';
import { Outlet } from 'react-router-dom';

export default function OrganizationDetails() {
	return (
		<Layout>
			<Outlet />
		</Layout>
	);
}
