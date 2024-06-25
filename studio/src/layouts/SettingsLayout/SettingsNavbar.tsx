import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
export interface Item {
	title: string;
	href: string;
	icon: React.ElementType;
}
export default function SettingsNavbar({ items }: { items: Item[] }) {
	const { t } = useTranslation();

	return (
		<div className='gap-6 p-3 bg-subtle rounded-lg sticky top-6 h-full'>
			<h4 className='text-default font-semibold text-sm leading-[32px] px-2'>
				{t('version.settings.default')}
			</h4>
			<nav>
				{items.map((item) => {
					return (
						<NavLink end key={item.href} to={item.href} className='grid gap-1'>
							<div className='p-2 rounded flex items-center gap-3 text-default leading-6 text-sm font-sfCompact font-normal hover:bg-lighter active:bg-lighter'>
								<item.icon className='text-icon-base size-6' />
								<p className='whitespace-nowrap'>{item.title}</p>
							</div>
						</NavLink>
					);
				})}
			</nav>
		</div>
	);
}
