import { ORGANIZATION_MENU_ITEMS } from '@/constants';
import { useLocation } from 'react-router-dom';
import OrganizationMenuItem from './OrganizationMenuItem';
import './organizationMenu.scss';
export default function OrganizationMenu() {
	const { pathname } = useLocation();
	return (
		<nav className='org-menu'>
			{ORGANIZATION_MENU_ITEMS.map((item) => {
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
