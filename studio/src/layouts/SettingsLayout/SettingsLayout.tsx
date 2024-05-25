import { cn } from '@/utils';
import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
interface VersionLayoutProps {
	children: ReactNode;
	navbar: ReactNode;
	className?: string;
}
export default function SettingsLayout({ children, navbar, className }: VersionLayoutProps) {
	const { pathname } = useLocation();
	return (
		<div className={cn('flex gap-6', className)}>
			{navbar && <div className='h-full min-w-[250px] p-4'>{navbar}</div>}
			<div className={cn('flex-1', !pathname.includes('authentications') && 'overflow-auto')}>
				{children}
			</div>
		</div>
	);
}
