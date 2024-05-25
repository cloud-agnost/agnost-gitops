import { handleTabChange } from '@/utils';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import './settingsNavbar.scss';
export interface Item {
	title: string;
	href: string;
	icon: React.ElementType;
}
export default function SettingsNavbar({ items }: { items: Item[] }) {
	const { t } = useTranslation();

	return (
		<div className='version-settings-navbar h-full'>
			<h4 className='version-settings-navbar-title'>{t('version.settings.default')}</h4>
			<nav>
				{items.map((item) => {
					return (
						<NavLink
							end
							key={item.href}
							to={item.href}
							onClick={() => handleTabChange(item.title, `settings/${item.href}`)}
						>
							<span className='flex items-center justify-center text-xl w-6 h-6'>
								<item.icon className='text-icon-base' />
							</span>
							<p className='whitespace-nowrap'>{item.title}</p>
						</NavLink>
					);
				})}
			</nav>
		</div>
	);
}
