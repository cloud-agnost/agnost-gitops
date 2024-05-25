import { Resizer } from '@/components/Resizer';
import { Tabs } from '@/features/version/Tabs';
import { SideNavigation } from '@/features/version/navigation';
import useUtilsStore from '@/store/version/utilsStore';
import { cn } from '@/utils';
import { ReactNode } from 'react';
import { Panel, PanelGroup } from 'react-resizable-panels';
import './versionLayout.scss';

interface VersionLayoutProps {
	children: ReactNode;
	className?: string;
}
export default function VersionLayout({ children, className }: VersionLayoutProps) {
	const { isSidebarOpen } = useUtilsStore();
	return (
		<div className='flex h-full'>
			<PanelGroup direction='horizontal' autoSaveId='sidebar' key={String(isSidebarOpen)}>
				<Panel defaultSize={isSidebarOpen ? 15 : 0} minSize={isSidebarOpen ? 12 : 0}>
					{isSidebarOpen && <SideNavigation />}
				</Panel>
				{isSidebarOpen && (
					<Resizer className='h-full' hide={!isSidebarOpen} orientation='vertical' />
				)}
				<Panel defaultSize={isSidebarOpen ? 85 : 100}>
					<div className='w-full'>
						<Tabs />
						<div className={cn('version-layout relative', className)} id='version-layout'>
							{children}
						</div>
					</div>
				</Panel>
			</PanelGroup>
		</div>
	);
}
