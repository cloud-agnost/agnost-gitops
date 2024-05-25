import { Button } from '@/components/Button';
import { InfoModal } from '@/components/InfoModal';
import { useStores, useUpdateEffect } from '@/hooks';
import useTabStore from '@/store/version/tabStore.ts';
import useVersionStore from '@/store/version/versionStore';
import { Tab, TabTypes } from '@/types';
import { formatCode, generateId, isWithinParentBounds } from '@/utils';
import type { Active, DropAnimation } from '@dnd-kit/core';
import {
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	defaultDropAnimationSideEffects,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import {
	SortableContext,
	arrayMove,
	horizontalListSortingStrategy,
	sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { NEW_TAB_ITEMS } from 'constants/constants.ts';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useMatches, useNavigate, useParams } from 'react-router-dom';
import TabControls from './TabControls';
import TabItem from './TabItem';
import './tabs.scss';

const dropAnimationConfig: DropAnimation = {
	sideEffects: defaultDropAnimationSideEffects({
		styles: {
			active: {
				opacity: '0.4',
			},
		},
	}),
};

export default function Tabs() {
	const scrollContainer = useRef<HTMLDivElement>(null);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const {
		getTabsByVersionId,
		addTab,
		setTabs,
		closeMultipleDeleteTabModal,
		removeMultipleTabs,
		closeDeleteTabModal,
		removeTab,
		toDeleteTab,
		toDeleteTabs,
		isMultipleDeleteTabModalOpen,
		isDeleteTabModalOpen,
	} = useTabStore();
	const { getVersionDashboardPath } = useVersionStore();
	const { t } = useTranslation();
	const matches = useMatches();
	const { pathname } = useLocation();
	const { getFunction, STORES } = useStores();
	const { versionId, orgId, appId } = useParams() as {
		versionId: string;
		orgId: string;
		appId: string;
	};
	const [active, setActive] = useState<Active | null>(null);
	const tabs = getTabsByVersionId(versionId);
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const activeItem = useMemo(() => tabs.find((item) => item.id === active?.id), [active, tabs]);
	useEffect(() => {
		if (!scrollContainer.current) return;
		setTimeout(() => {
			const selectedTab = scrollContainer?.current?.querySelector('[data-active=true]');
			const firstElement = scrollContainer?.current?.querySelector('.tab-item');
			const sidebar = document.getElementById('side-navigation');
			const elRect = firstElement?.getBoundingClientRect();
			if (
				selectedTab &&
				scrollContainer.current &&
				!isWithinParentBounds(selectedTab, scrollContainer.current) &&
				elRect
			) {
				scrollContainer?.current?.scrollBy({
					left:
						selectedTab?.getBoundingClientRect().left -
						elRect?.width -
						(sidebar?.getBoundingClientRect()?.width ?? 0),
					behavior: 'smooth',
				});
			}
		}, 100);
	}, [tabs]);

	useEffect(() => {
		if (getTabsByVersionId(versionId).find((tab: Tab) => tab.isDashboard)) return;
		addTab(versionId, {
			id: generateId(),
			title: t('version.dashboard.title'),
			path: getDashboardPath(),
			isDashboard: true,
			isActive: false,
			type: TabTypes.Dashboard,
		});
	}, [versionId]);

	useEffect(() => {
		const path = pathname?.split('/')?.slice(-1)[0];
		const currentTab = tabs.find((tab) => tab.isActive);
		const item = NEW_TAB_ITEMS.find((item) => item.path === path);
		if (currentTab?.path.includes(pathname)) {
			navigate(currentTab?.path);
			return;
		}

		if (item) {
			addTab(versionId, {
				id: generateId(),
				...item,
				isActive: true,
				path: getVersionDashboardPath(item.path),
			});
		}
	}, []);

	useUpdateEffect(() => {
		const currentTab = tabs.find((tab) => tab.isActive);
		if (currentTab?.path !== pathname) {
			const targetPath = currentTab?.path ?? getDashboardPath();
			navigate(targetPath);
		}
	}, [versionId]);

	function getDashboardPath() {
		const matched = matches.slice(-1)[0];
		if (!matched) return '/organization';
		const { appId, orgId, versionId } = matched.params;
		return `/organization/${orgId}/apps/${appId}/version/${versionId}`;
	}

	// function onDragEnd(result: DropResult) {
	// 	const { destination, source, draggableId } = result;
	// 	if (!destination) {
	// 		return;
	// 	}
	// 	if (destination.index === source.index) {
	// 		return;
	// 	}

	// 	const newTabs = Array.from(tabs);
	// 	const [removed] = newTabs.splice(source.index, 1);
	// 	newTabs.splice(destination.index, 0, removed);
	// 	setTabs(versionId, newTabs);
	// }

	async function handleSaveLogic(tab: Tab) {
		setLoading(true);
		const deleteLogic = getFunction(tab.type, 'deleteLogic');
		const editor = monaco.editor.getEditors()[0];
		const formattedLogic = await formatCode(editor.getValue());
		const setLogic = getFunction(tab.type, 'setLogics');
		const data = STORES[tab.type][tab.type.toLowerCase()];
		setLogic(formattedLogic);
		const saveLogic = getFunction(tab.type, `save${tab.type}Logic`);
		await saveLogic({
			orgId: orgId,
			appId: appId,
			versionId: versionId,
			[`${tab.type.toLowerCase()}Id`]: data._id,
			logic: formattedLogic,
		});
		deleteLogic?.(data._id);
	}

	function handleResetEditorState(tab: Tab) {
		const deleteLogic = getFunction(tab.type, 'deleteLogic');
		const id = tab.path.split('/').slice(-1)[0].split('?')[0];
		const data = STORES[tab.type][`${tab.type.toLowerCase()}s`].find(
			(item: any) => item._id === id,
		);
		deleteLogic(id);
		const uri = window.monaco.Uri.parse(`file:///src/${id}.js`);
		window.monaco.editor.getModel(uri)?.setValue(data.logic);
	}

	function closeMultipleTab() {
		const dirtyTabs = toDeleteTabs.filter((tab) => tab.isDirty);
		dirtyTabs.forEach((tab) => {
			handleResetEditorState(tab);
		});
		removeMultipleTabs(versionId, toDeleteTabs);
		closeMultipleDeleteTabModal();
	}

	async function closeAndSaveMultipleTab() {
		const dirtyTabs = toDeleteTabs.filter((tab) => tab.isDirty);
		await Promise.all(dirtyTabs.map(async (tab) => handleSaveLogic(tab)));
		removeMultipleTabs(versionId, toDeleteTabs);
		closeMultipleDeleteTabModal();
	}

	function closeTab() {
		handleResetEditorState(toDeleteTab);
		removeTab(versionId, toDeleteTab.id);
		closeDeleteTabModal();
	}

	async function closeAndSaveTab() {
		await handleSaveLogic(toDeleteTab);
		removeTab(versionId, toDeleteTab.id);
		closeDeleteTabModal();
	}

	return (
		<div className='navigation-tab-container'>
			<div className='max-w-full overflow-auto'>
				<DndContext
					sensors={sensors}
					onDragStart={({ active }) => {
						setActive(active);
					}}
					onDragEnd={({ active, over }) => {
						if (over && active.id !== over?.id) {
							const activeIndex = tabs.findIndex(({ id }) => id === active.id);
							const overIndex = tabs.findIndex(({ id }) => id === over.id);
							if (activeIndex === -1 || overIndex === -1) return;
							if (overIndex === 0) return;
							setTabs(versionId, arrayMove(tabs, activeIndex, overIndex));
						}
						setActive(null);
					}}
					onDragCancel={() => {
						setActive(null);
					}}
					modifiers={[restrictToHorizontalAxis]}
				>
					<SortableContext items={tabs} strategy={horizontalListSortingStrategy}>
						<div className='h-full' role='application'>
							<div ref={scrollContainer} className='tab'>
								{tabs.map((tab: Tab) => (
									<TabItem tab={tab} key={tab.id} />
								))}
							</div>
						</div>
					</SortableContext>
					<DragOverlay dropAnimation={dropAnimationConfig}>
						<div className='tab'>{activeItem ? <TabItem tab={activeItem} /> : null}</div>
					</DragOverlay>
				</DndContext>
			</div>
			<TabControls scrollContainer={scrollContainer} />
			<InfoModal
				isOpen={isMultipleDeleteTabModalOpen}
				closeModal={closeMultipleDeleteTabModal}
				onConfirm={closeMultipleTab}
				action={
					<Button variant='secondary' size='lg' onClick={closeAndSaveMultipleTab} loading={loading}>
						{t('general.save_and_close')}
					</Button>
				}
				title={t('general.multiple_tab_close_title')}
				description={t('general.tab_close_description_count', {
					count: toDeleteTabs.filter((tab) => tab.isDirty).length,
				})}
			/>
			<InfoModal
				isOpen={isDeleteTabModalOpen}
				closeModal={closeDeleteTabModal}
				onConfirm={closeTab}
				action={
					<Button variant='secondary' size='lg' onClick={closeAndSaveTab} loading={loading}>
						{t('general.save_and_close')}
					</Button>
				}
				title={t('general.tab_close_title')}
				description={t('general.tab_close_description')}
			/>
		</div>
	);
}
