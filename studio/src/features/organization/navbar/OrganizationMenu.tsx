import { ORGANIZATION_MENU_ITEMS } from '@/constants';
import useClusterStore from '@/store/cluster/clusterStore';
import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OrganizationMenuItem from './OrganizationMenuItem';
import './organizationMenu.scss';
export default function OrganizationMenu() {
	const { pathname } = useLocation();
	const { isCiCdEnabled } = useClusterStore();
	const navigate = useNavigate();
	useEffect(() => {
		if (pathname) {
			if (pathname.split('/').length <= 3) {
				console.log(isCiCdEnabled);
				navigate(isCiCdEnabled ? 'projects' : 'apps');
			}
		}
	}, [pathname, isCiCdEnabled]);

	const menuItems = useMemo(() => {
		if (isCiCdEnabled) {
			return ORGANIZATION_MENU_ITEMS;
		}
		return ORGANIZATION_MENU_ITEMS.slice(1);
	}, [isCiCdEnabled]);

	return (
		<nav className='org-menu'>
			{menuItems.map((item) => {
				return (
					<OrganizationMenuItem
						key={item.name}
						item={item}
						active={pathname.includes(item.href)}
						isNavigate
					/>
				);
			})}
		</nav>
	);
}
