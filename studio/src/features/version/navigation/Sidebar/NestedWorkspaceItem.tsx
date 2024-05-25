import { Button } from '@/components/Button';
import { CollapsibleContent, CollapsibleTrigger } from '@/components/Collapsible';
import { useStores, useTabIcon, useTabNavigate } from '@/hooks';
import useTabStore from '@/store/version/tabStore';
import useUtilsStore from '@/store/version/utilsStore';
import useVersionStore from '@/store/version/versionStore';
import { TabTypes } from '@/types';
import { cn } from '@/utils';
import { CaretRight, PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import _ from 'lodash';
import { useParams } from 'react-router-dom';
import { ExplorerCollapsible } from './ExplorerCollapsible';
import SideBarButton from './SideBarButton';
import { WorkspaceDataType } from './Workspace';
import useAuthStore from '@/store/auth/authStore';
import useThemeStore from '@/store/theme/themeStore';

interface NestedWorkspaceItemProps {
	data: any;
	type: TabTypes;
	onDelete: (data: WorkspaceDataType, type: TabTypes) => void;
}

export default function NestedWorkspaceItem({ data, type, onDelete }: NestedWorkspaceItemProps) {
	const getIcon = useTabIcon('w-3.5 h-3.5');
	const { getTheme } = useThemeStore();
	const user = useAuthStore((state) => state.user);
	const { sidebar, toggleWorkspaceTab } = useUtilsStore();
	const { getVersionDashboardPath } = useVersionStore();
	const { orgId, appId, versionId } = useParams() as Record<string, string>;
	const { getCurrentTab } = useTabStore();
	const currentTab = getCurrentTab(versionId);
	const { getFunction, data: subData, STORES } = useStores();
	const navigate = useTabNavigate();
	const dataTabType = type === TabTypes.Model ? TabTypes.Field : TabTypes.Bucket;
	function loadItems() {
		if (_.isEmpty(subData[type][data._id]) && !sidebar[versionId]?.openedTabs?.includes(type)) {
			const getItems = getFunction(type, `get${type}s`);
			getItems({
				orgId,
				appId,
				versionId,
				dbId: data._id,
				page: 0,
				size: 250,
				sortBy: 'name',
				sortDir: 'asc',
				workspace: true,
			});
		}
	}

	function openEditDialog(data: WorkspaceDataType, type: TabTypes) {
		const openEditModal = getFunction(type, `openEdit${type}Modal`);
		openEditModal(data);
	}

	function handleDataClick(sd: WorkspaceDataType) {
		let path = '';

		if (type === TabTypes.Model) {
			path = `database/${data._id}/models/${sd._id}/fields`;
		}

		if (type === TabTypes.Bucket) {
			path = `storage/${data._id}/buckets/${sd._id}`;
		}
		navigate({
			title: sd.name,
			path: getVersionDashboardPath(path),
			isActive: true,
			isDashboard: false,
			type: dataTabType,
		});
	}

	function handleTriggerClick() {
		let path = '';

		if (type === TabTypes.Model) {
			path = `database/${data._id}/models`;
		}

		if (type === TabTypes.Bucket) {
			path = `storage/${data._id}`;
		}
		navigate({
			title: data.name,
			path: getVersionDashboardPath(path),
			isActive: true,
			isDashboard: false,
			type,
		});
	}

	function handleOpenCreateModal(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
		e.stopPropagation();
		STORES[type].toggleCreateModal();
	}
	return (
		<ExplorerCollapsible
			key={data._id}
			open={sidebar[versionId]?.openedTabs?.includes(data._id) as boolean}
			className={cn('w-full')}
			onOpenChange={() => toggleWorkspaceTab(data._id)}
			trigger={
				<CollapsibleTrigger asChild onClick={loadItems} id={data._id} key={data._id}>
					<div
						className={cn(
							'flex items-center group',
							window.location.pathname.includes(data._id) && type === currentTab?.type
								? 'bg-button-primary/90 dark:bg-button-primary/70 text-default'
								: 'hover:bg-lighter text-subtle hover:text-default',
						)}
					>
						<Button
							variant='blank'
							className={cn(
								'justify-start text-left gap-2 text-xs font-normal cursor-pointer !h-6 !rounded-none whitespace-nowrap  pl-5 flex-1 w-full group',
							)}
							size='sm'
							onClick={handleTriggerClick}
						>
							<div className='flex items-center gap-1'>
								<CaretRight
									size={14}
									className={cn(
										'transition-transform duration-200 text-subtle group-hover:text-default',
										sidebar[versionId]?.openedTabs?.includes(data._id) && 'rotate-90 text-default',
									)}
								/>
								<div
									className={cn(
										'flex-1/2',
										window.location.pathname.includes(data._id) &&
											type === currentTab?.type &&
											getTheme(user._id) === 'light' &&
											'[&>svg]:text-white',
									)}
								>
									{getIcon(type === TabTypes.Model ? TabTypes.Database : TabTypes.Storage)}
								</div>
							</div>
							<h1
								title={data.name}
								className={cn(
									'truncate font-sfCompact text-subtle',
									window.location.pathname.includes(data._id) && type === currentTab?.type
										? 'text-white dark:text-default'
										: 'text-subtle group-hover:text-default',
								)}
							>
								{data.name}
							</h1>
						</Button>
						<div className='flex items-center justify-end'>
							{window.location.pathname.includes(data._id) && type && (
								<Button
									variant='icon'
									size='sm'
									rounded
									className={cn(
										window.location.pathname.includes(data._id) &&
											type === currentTab?.type &&
											'hover:bg-brand-darker dark:hover:bg-button-primary !text-white dark:text-default',
										'!p-0 !h-5 hidden group-hover:inline-flex',
									)}
									onClick={handleOpenCreateModal}
								>
									<Plus size={14} />
								</Button>
							)}

							<Button
								variant='icon'
								size='sm'
								rounded
								className={cn(
									window.location.pathname.includes(data._id) &&
										'hover:bg-brand-darker dark:hover:bg-button-primary !text-white dark:text-default',
									'p-0 !h-5 hidden group-hover:inline-flex',
								)}
								onClick={(e) => {
									e.stopPropagation();
									openEditDialog(data, TabTypes.Database);
								}}
							>
								<PencilSimple size={14} />
							</Button>

							<Button
								rounded
								className={cn(
									window.location.pathname.includes(data._id) &&
										'hover:bg-brand-darker dark:hover:bg-button-primary !text-white dark:text-default',
									'p-0 !h-5 hidden group-hover:inline-flex',
								)}
								variant='icon'
								size='sm'
								onClick={(e) => {
									e.stopPropagation();
									onDelete(data, TabTypes.Database);
								}}
							>
								<Trash size={14} />
							</Button>
						</div>
					</div>
				</CollapsibleTrigger>
			}
		>
			<CollapsibleContent>
				{subData[type][data._id]?.map((sd: any) => (
					<SideBarButton
						key={sd._id}
						id={sd._id}
						active={window.location.pathname.includes(sd._id)}
						onClick={() => handleDataClick(sd)}
						title={sd.name}
						type={type}
						className='px-8 ml-5'
						actions={
							<div className='flex items-center justify-end'>
								<Button
									variant='icon'
									size='sm'
									rounded
									className={cn(
										window.location.pathname.includes(sd._id) &&
											'hover:bg-brand-darker dark:hover:bg-button-primary !text-white dark:text-default',
										'p-0 !h-5 hidden group-hover:inline-flex',
									)}
									onClick={(e) => {
										e.stopPropagation();
										openEditDialog(sd, type);
									}}
								>
									<PencilSimple size={14} />
								</Button>

								<Button
									rounded
									className={cn(
										window.location.pathname.includes(sd._id) &&
											'hover:bg-brand-darker dark:hover:bg-button-primary !text-white dark:text-default',
										'p-0 !h-5 hidden group-hover:inline-flex',
									)}
									variant='icon'
									size='sm'
									onClick={() => onDelete(sd, type)}
								>
									<Trash size={14} />
								</Button>
							</div>
						}
					/>
				))}
			</CollapsibleContent>
		</ExplorerCollapsible>
	);
}
