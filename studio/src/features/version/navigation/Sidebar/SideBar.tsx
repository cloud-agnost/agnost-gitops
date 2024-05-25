import { Button } from '@/components/Button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/Tooltip';
import useTabStore from '@/store/version/tabStore';
import useUtilsStore from '@/store/version/utilsStore';
import useVersionStore from '@/store/version/versionStore';
import { TabTypes } from '@/types';
import { isElementInViewport } from '@/utils';
import { MagnifyingGlass, MinusSquare } from '@phosphor-icons/react';
import { useEffect, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import CodeSearch from './CodeSearch/CodeSearch';
import OpenTabs from './OpenTabs';
import VersionSettingsExplorer from './VersionSettingsExplorer';
import Workspace from './Workspace';
export default function SideBar() {
	const { t } = useTranslation();

	const { toggleSidebar, isSidebarOpen, collapseAll } = useUtilsStore();
	const { toggleSearchView, isSearchViewOpen } = useVersionStore();
	const { versionId } = useParams() as Record<string, string>;
	const { getCurrentTab, tabs } = useTabStore();
	useEffect(() => {
		const toggleSidebarShortcut = (e: KeyboardEvent) => {
			if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				toggleSidebar();
			}
		};

		document.addEventListener('keypress', toggleSidebarShortcut);
		return () => document.removeEventListener('keydown', toggleSidebarShortcut);
	}, []);

	useLayoutEffect(() => {
		let timeout: any;
		const scrollToElement = async () => {
			const currentTab = getCurrentTab(versionId);
			const dataId =
				currentTab.type === TabTypes.Settings
					? currentTab.title
					: window.location.pathname.split('/').slice(-1).pop();
			const targetElement = document.getElementById(dataId as string);

			if (targetElement && !isElementInViewport(targetElement)) {
				targetElement.scrollIntoView({ behavior: 'smooth' });
			}
		};

		if (isSidebarOpen) {
			timeout = setInterval(scrollToElement, 250);
		}
		setTimeout(() => {
			clearInterval(timeout);
		}, 750);
		return () => {
			clearInterval(timeout);
		};
	}, [isSidebarOpen, tabs]);

	return (
		<div
			className='full-height-without-header w-full shadow-xl flex flex-col bg-subtle/50 dark:bg-[#171d2d]'
			id='side-navigation'
		>
			<div className='px-2 py-[0.22rem] border-b border-border group flex items-center justify-between'>
				<h1 className='text-xs text-default'>
					{isSearchViewOpen ? t('general.search') : t('version.explorer')}
				</h1>
				<div className='flex items-center'>
					{!isSearchViewOpen && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant='icon'
										size='sm'
										rounded
										className='!p-0 !h-6 invisible group-hover:visible'
										onClick={collapseAll}
									>
										<MinusSquare size={16} />
									</Button>
								</TooltipTrigger>
								<TooltipContent>{t('version.collapse_all')}</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant={isSearchViewOpen ? 'primary' : 'icon'}
									rounded
									iconOnly
									size='sm'
									onClick={toggleSearchView}
									className='!p-0 !h-6 invisible group-hover:visible aspect-square'
								>
									<MagnifyingGlass size={16} />
								</Button>
							</TooltipTrigger>
							<TooltipContent>{t('version.search_files')}</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>
			{isSearchViewOpen ? (
				<CodeSearch />
			) : (
				<>
					<OpenTabs />
					<div className='overflow-y-auto overflow-x-hidden pb-2 flex-1'>
						<Workspace />
						<VersionSettingsExplorer />
					</div>
				</>
			)}
		</div>
	);
}
