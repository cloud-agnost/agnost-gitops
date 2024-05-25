import { Button } from '@/components/Button';
import { useTabIcon } from '@/hooks';
import useTabStore from '@/store/version/tabStore';
import useUtilsStore from '@/store/version/utilsStore';
import { Tab } from '@/types';
import { cn } from '@/utils';
import { useSortable } from '@dnd-kit/sortable';
import { X } from '@phosphor-icons/react';
import { CSSProperties, createContext, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CSS } from '@dnd-kit/utilities';
import { DraggableSyntheticListeners } from '@dnd-kit/core';
interface TabItemProps {
	tab: Tab;
}

interface Context {
	attributes: Record<string, any>;
	listeners: DraggableSyntheticListeners;
	ref(node: HTMLElement | null): void;
}

const SortableItemContext = createContext<Context>({
	attributes: {},
	listeners: undefined,
	ref() {},
});

export default function TabItem({ tab, ...props }: TabItemProps) {
	const { versionId } = useParams() as { versionId: string };
	const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition } =
		useSortable({ id: tab.id, disabled: tab.isDashboard });
	const context = useMemo(
		() => ({
			attributes,
			listeners,
			ref: setActivatorNodeRef,
		}),
		[attributes, listeners, setActivatorNodeRef],
	);
	const style: CSSProperties = {
		transform: CSS.Translate.toString(transform),
		transition,
	};
	const { removeTab, setCurrentTab, openDeleteTabModal } = useTabStore();
	function close() {
		if (tab.isDirty) {
			openDeleteTabModal(tab);
		} else {
			removeTab(versionId, tab.id);
		}
	}

	function onClick() {
		setCurrentTab(versionId, tab.id);
		history.pushState(
			{
				tabId: tab.id,
				type: 'tabChanged',
			},
			'',
			tab.path,
		);
	}
	const getTabIcon = useTabIcon('w-3.5 h-3.5');
	const { isSidebarOpen } = useUtilsStore();
	return (
		<SortableItemContext.Provider value={context}>
			<div
				ref={setNodeRef}
				style={style}
				{...attributes}
				{...listeners}
				className={cn(
					'tab-item icon border-x border-border relative',
					isSidebarOpen && 'border-l-0',
					tab.isDashboard && 'closeable',
					tab.isActive && 'active',
				)}
				{...props}
				title={tab.title}
				{...(tab.isActive && { 'data-active': true })}
			>
				<Link title={tab.title} className={cn('tab-item-link')} onClick={onClick} to={tab.path}>
					<div className='flex items-center gap-2'>
						{getTabIcon(tab.type)}
						{!tab.isDashboard && <p className='tab-item-link-text'>{tab.title} </p>}
					</div>
				</Link>
				<div className='tab-item-close group relative'>
					{tab.isDirty && (
						<span className='text-default rounded-full bg-base-reverse w-2 h-2 absolute group-hover:invisible' />
					)}
					{!tab.isDashboard && (
						<Button rounded variant='icon' size='sm' onClick={close} className='!h-[unset] !p-1'>
							<X size={12} />
						</Button>
					)}
				</div>
			</div>
		</SortableItemContext.Provider>
	);
}
