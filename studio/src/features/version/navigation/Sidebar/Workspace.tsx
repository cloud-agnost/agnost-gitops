import { Button } from '@/components/Button';
import { InfoModal } from '@/components/InfoModal';
import { NEW_TAB_ITEMS } from '@/constants';
import { useStores, useTabNavigate, useToast } from '@/hooks';
import useCacheStore from '@/store/cache/cacheStore';
import useDatabaseStore from '@/store/database/databaseStore';
import useTabStore from '@/store/version/tabStore';
import useUtilsStore from '@/store/version/utilsStore';
import useVersionStore from '@/store/version/versionStore';
import {
	Bucket,
	Cache,
	Database,
	Endpoint,
	HelperFunction,
	MessageQueue,
	Middleware,
	Model,
	Storage,
	Tab,
	TabTypes,
	Task,
} from '@/types';
import { cn, generateId } from '@/utils';
import { PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { ExplorerCollapsible, ExplorerCollapsibleTrigger } from './ExplorerCollapsible';
import NestedWorkspaceItem from './NestedWorkspaceItem';
import SideBarButton from './SideBarButton';

export type WorkspaceDataType =
	| Endpoint
	| HelperFunction
	| Middleware
	| Storage
	| Database
	| MessageQueue
	| Task
	| Cache
	| Model
	| Bucket;

export default function Workspace() {
	const navigate = useTabNavigate();
	const { database } = useDatabaseStore();
	const { sidebar, toggleWorkspaceTab } = useUtilsStore();
	const { getVersionDashboardPath } = useVersionStore();
	const { getCurrentTab } = useTabStore();
	const { toast } = useToast();
	const { orgId, appId, versionId } = useParams() as Record<string, string>;
	const [toDeleteData, setToDeleteData] = useState<{
		type: TabTypes;
		data: WorkspaceDataType;
	} | null>(null);
	const [openInfoModal, setOpenInfoModal] = useState(false);
	const currentTab = getCurrentTab(versionId);
	const { t } = useTranslation();
	const { openEditCacheModal } = useCacheStore();
	const { getFunction, data } = useStores();

	const { mutateAsync: deleteMutation, isPending } = useMutation({
		mutationFn: handleDeleteMutation,
		onSuccess: () => {
			setOpenInfoModal(false);
			setToDeleteData(null);
		},
		onError: ({ details }) => {
			toast({ action: 'error', title: details });
		},
	});

	function handleDataClick(data: WorkspaceDataType, type: TabTypes) {
		if (type === TabTypes.Cache) {
			openEditCacheModal(data as Cache);
			return;
		}
		let path = `${type.toLowerCase()}/${data._id}`;
		if (type === TabTypes.Database) {
			path = `${path}/models`;
		}

		navigate({
			title: data.name,
			path: getVersionDashboardPath(path),
			isActive: true,
			isDashboard: false,
			type,
		});
	}

	function handleDeleteMutation() {
		if (!toDeleteData) return;
		const fn = getFunction(toDeleteData.type, `delete${toDeleteData?.type}`);
		return fn({
			[`${toDeleteData?.type.toLowerCase()}Id`]: toDeleteData?.data._id,
			orgId: orgId,
			appId: appId,
			versionId: versionId,
			...(toDeleteData.type === TabTypes.Model && { dbId: database._id }),
		});
	}

	function deleteHandler(data: WorkspaceDataType, type: TabTypes) {
		setToDeleteData({
			type,
			data,
		});
		const openDeleteModal = getFunction(type, `openDelete${type}Modal`);
		if ([TabTypes.Cache, TabTypes.Database, TabTypes.Storage].includes(type)) {
			openDeleteModal(data);
		} else setOpenInfoModal(true);
	}

	function openEditDialog(data: WorkspaceDataType, type: TabTypes) {
		const openEditModal = getFunction(type, `openEdit${type}Modal`);
		openEditModal(data);
	}

	function getDeleteTitle(): string {
		if (!toDeleteData) return '';

		if (toDeleteData.type === TabTypes.Middleware)
			return t(`version.${toDeleteData.type.toLowerCase()}.delete.title`);
		if (toDeleteData.type === TabTypes.Model) return t(`database.models.delete.title`);
		return t(`${toDeleteData.type.toLowerCase()}.delete.title`);
	}
	function getDeleteMessage() {
		if (!toDeleteData) return '';
		if (toDeleteData.type === TabTypes.Middleware)
			return t(`version.${toDeleteData.type.toLowerCase()}.delete.message`);
		if (toDeleteData.type === TabTypes.Model) return t(`database.models.delete.description`);
		return t(`${toDeleteData.type.toLowerCase()}.delete.message`);
	}

	useEffect(() => {
		if (sidebar[versionId]?.openedTabs) {
			sidebar[versionId]?.openedTabs?.forEach(async (item) => {
				if (item === TabTypes.Settings) return;
				const getItems = getFunction(item as TabTypes, `get${item}s`);
				if (!getItems) return;
				await getItems({
					orgId,
					appId,
					versionId,
					page: 0,
					size: 250,
					sortBy: 'name',
					sortDir: 'asc',
					workspace: true,
				});
			});
		}
	}, [appId, versionId]);
	return (
		<>
			{NEW_TAB_ITEMS.sort((a, b) => a.title.localeCompare(b.title)).map((item) => (
				<ExplorerCollapsible
					open={sidebar[versionId]?.openedTabs?.includes(item.type) as boolean}
					onOpenChange={() => toggleWorkspaceTab(item.type)}
					key={item.type}
					trigger={<WorkspaceTrigger item={item} />}
				>
					{data[item.type]?.map((data: any) =>
						item.type === TabTypes.Database ? (
							<NestedWorkspaceItem
								data={data}
								key={data._id}
								type={item.type === TabTypes.Database ? TabTypes.Model : TabTypes.Bucket}
								onDelete={deleteHandler}
							/>
						) : (
							<SideBarButton
								key={data._id}
								id={data._id}
								active={
									window.location.pathname.includes(data._id) && item.type === currentTab?.type
								}
								onClick={() => handleDataClick(data, item.type)}
								title={data.name}
								type={item.type}
								actions={
									<div className='flex items-center justify-end'>
										<Button
											variant='icon'
											size='sm'
											rounded
											className={cn(
												window.location.pathname.includes(data._id) &&
													item.type === currentTab?.type &&
													'hover:bg-brand-darker dark:hover:bg-button-primary !text-white dark:text-default',
												'!p-0 !h-5 hidden group-hover:inline-flex',
											)}
											onClick={(e) => {
												e.stopPropagation();
												openEditDialog(data, item.type);
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
												deleteHandler(data, item.type);
											}}
										>
											<Trash size={14} />
										</Button>
									</div>
								}
							/>
						),
					)}
				</ExplorerCollapsible>
			))}
			<InfoModal
				isOpen={openInfoModal}
				closeModal={() => setOpenInfoModal(false)}
				title={getDeleteTitle()}
				description={getDeleteMessage()}
				onConfirm={deleteMutation}
				loading={isPending}
			/>
		</>
	);
}

function WorkspaceTrigger({ item }: { item: Omit<Tab, 'id'> }) {
	const { toggleWorkspaceTab, sidebar } = useUtilsStore();
	const { addTab } = useTabStore();
	const { getVersionDashboardPath } = useVersionStore();
	const { orgId, appId, versionId } = useParams() as Record<string, string>;
	const { getFunction, data, STORES } = useStores();
	function handleAddTab(item: (typeof NEW_TAB_ITEMS)[number]) {
		const tab = {
			id: generateId(),
			...item,
			path: getVersionDashboardPath(item.path),
		};
		addTab(versionId, tab);
		toggleWorkspaceTab(item.type);
	}

	function loadItems() {
		if (_.isEmpty(data[item.type]) && !sidebar[versionId]?.openedTabs?.includes(item.type)) {
			const getItems = getFunction(item.type, `get${item.type}s`);
			getItems({
				orgId,
				appId,
				versionId,
				page: 0,
				size: 250,
				sortBy: 'name',
				sortDir: 'asc',
				workspace: true,
			});
		}
	}

	return (
		<ExplorerCollapsibleTrigger
			active={sidebar[versionId]?.openedTabs?.includes(item.type) as boolean}
			onClick={loadItems}
		>
			<Button
				onClick={() => handleAddTab(item)}
				key={item.path}
				className='justify-start w-full text-left font-normal gap-2'
				variant='blank'
				size='sm'
			>
				<h1 title={item.title} className={cn('truncate max-w-[15ch] text-xs text-subtle')}>
					{item.title}
				</h1>
			</Button>

			<Button
				variant='icon'
				size='sm'
				rounded
				className='h-full !w-5 p-0.5 mr-2 invisible group-hover:visible'
				onClick={STORES[item.type].toggleCreateModal}
			>
				<Plus className='w-3.5 h-3.5' />
			</Button>
		</ExplorerCollapsibleTrigger>
	);
}
