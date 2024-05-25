import { Button } from '@/components/Button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuItemContainer,
	DropdownMenuTrigger,
} from '@/components/Dropdown';
import { Knative, Kubernetes } from '@/components/icons';
import { CONTAINER_TYPES } from '@/constants';
import useContainerStore from '@/store/container/containerStore';
import { ContainerType } from '@/types/container';
import { toDisplayName } from '@/utils';
import { CaretDown, Cloud, Package, Plus, Timer } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import CreateContainerDrawer from './CreateContainerDrawer';
export default function CreateContainerButton() {
	const { t } = useTranslation();
	const canCreateContainer = true;
	const { openCreateContainerDialog } = useContainerStore();
	function getContainerIcon(type: ContainerType) {
		switch (type) {
			case 'deployment':
				return <Package size={16} />;
			case 'knative service':
				return <Knative className='size-4' />;
			case 'cron job':
				return <Timer size={16} />;
			case 'stateful set':
				return <Kubernetes className='size-4' />;
			default:
				return <Cloud size={16} />;
		}
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild disabled={!canCreateContainer}>
					<Button className='gap-1 whitespace-nowrap' disabled={!canCreateContainer}>
						<Plus size={14} weight='bold' />
						{t('container.create_container')}
						<CaretDown size={14} />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='overflow-y-auto'>
					<DropdownMenuItemContainer>
						<DropdownMenuGroup>
							{CONTAINER_TYPES.map((containerType) => (
								<DropdownMenuItem
									key={containerType}
									className='gap-2'
									onSelect={() => openCreateContainerDialog(containerType as ContainerType)}
								>
									{getContainerIcon(containerType as ContainerType)}
									{toDisplayName(containerType)}
								</DropdownMenuItem>
							))}
						</DropdownMenuGroup>
					</DropdownMenuItemContainer>
				</DropdownMenuContent>
			</DropdownMenu>
			<CreateContainerDrawer />
		</>
	);
}
