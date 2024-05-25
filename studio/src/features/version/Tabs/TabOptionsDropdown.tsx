import { Button } from '@/components/Button';
import { useTabIcon } from '@/hooks';
import useTabStore from '@/store/version/tabStore.ts';
import useVersionStore from '@/store/version/versionStore';
import { cn } from '@/utils';
import { DotsThreeVertical } from '@phosphor-icons/react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuItemContainer,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from 'components/Dropdown';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

export default function TabOptionsDropdown() {
	const { t } = useTranslation();

	const {
		removeAllTabs,
		getCurrentTab,
		getTabsByVersionId,
		removeTab,
		removeAllTabsExcept,
		getPreviousTab,
		removeAllAtRight,
		setCurrentTab,
		openMultipleDeleteTabModal,
	} = useTabStore();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const { getVersionDashboardPath } = useVersionStore();
	const { versionId } = useParams() as { versionId: string };
	const currentTab = getCurrentTab(versionId);
	const tabs = getTabsByVersionId(versionId);
	const getTabIcon = useTabIcon('w-4 h-4');
	const tabOptions = [
		{
			title: t('version.close_selected_tab'),
			action: () => {
				if (!currentTab) return;
				const redirectTab = getPreviousTab(versionId, currentTab.id);
				removeTab(versionId, currentTab.id);
				setTimeout(() => {
					if (redirectTab) navigate(redirectTab.path);
				}, 1);
			},
			disabled: pathname.split('?')[0] === getVersionDashboardPath(),
		},
		{
			title: t('version.close_all_tabs'),
			action: () => {
				if (tabs.some((tab) => tab.isDirty)) {
					openMultipleDeleteTabModal(tabs);
				} else {
					removeAllTabs(versionId);
					navigate(getVersionDashboardPath());
				}
			},
			disabled: tabs.length < 2,
		},
		{
			title: t('version.close_at_right'),
			action: () => {
				removeAllAtRight(versionId);
			},
			disabled: tabs.indexOf(currentTab) === tabs.length - 1,
		},
		{
			title: t('version.close_all_tabs_except_current'),
			action: () => {
				if (!currentTab) return;
				if (tabs.filter((tab) => tab.id !== currentTab.id).some((tab) => tab.isDirty)) {
					openMultipleDeleteTabModal(tabs.filter((tab) => tab.id !== currentTab.id));
				} else {
					removeAllTabsExcept(versionId);
				}
			},
			disabled: tabs.filter((tab) => !tab.isDashboard).length < 2,
		},
	];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button rounded variant='icon' size='sm'>
					<DotsThreeVertical size={15} weight='bold' />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className='min-w-[208px] mr-1 mt-3'>
				<DropdownMenuItemContainer>
					{tabOptions.map((option, index) => (
						<Fragment key={index}>
							<DropdownMenuItem disabled={option.disabled} onClick={option.action}>
								{option.title}
							</DropdownMenuItem>
							{index === 0 && <DropdownMenuSeparator />}
						</Fragment>
					))}
				</DropdownMenuItemContainer>
				<DropdownMenuSeparator />
				<DropdownMenuItemContainer className='max-h-[25rem] overflow-auto'>
					{tabs.map((tab) => (
						<DropdownMenuItem
							className={cn(tab.isActive && 'active', 'flex items-center gap-2 relative')}
							key={tab.id}
							onClick={() => {
								setCurrentTab(versionId, tab.id);
								navigate(tab.path);
							}}
						>
							{getTabIcon(tab.type)}
							<h1 title={tab.title} className='flex-1 truncate max-w-[200px]'>
								{tab.title}
							</h1>
							{tab.isDirty && (
								<span className='text-default rounded-full bg-base-reverse w-2 h-2' />
							)}
						</DropdownMenuItem>
					))}
				</DropdownMenuItemContainer>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
