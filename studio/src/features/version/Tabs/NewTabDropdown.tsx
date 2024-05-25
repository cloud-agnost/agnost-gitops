import { Button } from '@/components/Button';
import { NEW_TAB_ITEMS } from '@/constants';
import { useTabIcon } from '@/hooks';
import useTabStore from '@/store/version/tabStore.ts';
import useVersionStore from '@/store/version/versionStore';
import { TabTypes } from '@/types';
import { capitalize, generateId } from '@/utils';
import { Plus } from '@phosphor-icons/react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuItemContainer,
	DropdownMenuTrigger,
} from 'components/Dropdown';
import { useParams } from 'react-router-dom';
export default function NewTabDropdown() {
	const { addTab } = useTabStore();
	const { getVersionDashboardPath } = useVersionStore();
	const { versionId } = useParams() as {
		versionId: string;
		appId: string;
		orgId: string;
	};

	function handleAddTab(item: (typeof NEW_TAB_ITEMS)[number]) {
		const tab = {
			id: generateId(),
			...item,
			path: getVersionDashboardPath(item.path),
		};
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		addTab(versionId, tab);
	}
	const getIcon = useTabIcon('w-3.5 h-3.5');
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button rounded variant='icon' size='sm'>
					<Plus size={15} />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end'>
				<DropdownMenuItemContainer className='overflow-auto max-h-96'>
					{NEW_TAB_ITEMS.sort((a, b) => a.title.localeCompare(b.title)).map((item) => (
						<DropdownMenuItem
							onClick={() => handleAddTab(item)}
							asChild
							key={item.path}
							className='flex items-center gap-2 relative'
						>
							<div>
								{getIcon(capitalize(item.type) as TabTypes)}
								<h1 title={item.title} className='flex-1 truncate max-w-[15ch] text-xs'>
									{item.title}
								</h1>
							</div>
						</DropdownMenuItem>
					))}
				</DropdownMenuItemContainer>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
