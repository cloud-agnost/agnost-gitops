import { Button } from '@/components/Button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuItemContainer,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from '@/components/Dropdown';
import { Kubernetes } from '@/components/icons';
import { CONTAINER_TYPES } from '@/constants';
import useContainerStore from '@/store/container/containerStore';
import { ContainerType } from '@/types';
import { toDisplayName } from '@/utils';
import { CaretDown, Cloud, HardDrive, Package, Plus, Timer } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import CreateContainerDrawer from './CreateContainerDrawer';
import { useSearchParams } from 'react-router-dom';
export default function CreateContainerButton() {
	const { t } = useTranslation();
	const canCreateContainer = true;
	const { openCreateContainerDialog } = useContainerStore();
	const { getContainerTemplates } = useContainerStore();
	const [_, setSearchParams] = useSearchParams();
	function getContainerIcon(type: ContainerType) {
		switch (type) {
			case 'deployment':
				return <Package size={16} />;
			case 'cron job':
				return <Timer size={16} />;
			case 'statefulset':
				return <Kubernetes className='size-4' />;

			default:
				return <Cloud size={16} />;
		}
	}

	const { data: containerTemplates } = useQuery({
		queryKey: ['containerTemplates'],
		queryFn: getContainerTemplates,
	});

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
							<DropdownMenuSub>
								<DropdownMenuSubTrigger className='gap-2'>
									<HardDrive size={16} />
									{t('container.template')}
								</DropdownMenuSubTrigger>
								<DropdownMenuPortal>
									<DropdownMenuSubContent>
										{containerTemplates?.map(({ category, templates }) => (
											<DropdownMenuGroup key={category}>
												<DropdownMenuLabel>{category}</DropdownMenuLabel>
												{templates.map((template) => (
													<DropdownMenuItem
														key={template.name}
														className='gap-2'
														onSelect={() => {
															openCreateContainerDialog(template.type as ContainerType);
															setSearchParams({ template: template.name });
														}}
													>
														<Package size={16} />
														{template.name}
													</DropdownMenuItem>
												))}
												<DropdownMenuSeparator />
											</DropdownMenuGroup>
										))}
									</DropdownMenuSubContent>
								</DropdownMenuPortal>
							</DropdownMenuSub>
						</DropdownMenuGroup>
					</DropdownMenuItemContainer>
				</DropdownMenuContent>
			</DropdownMenu>
			<CreateContainerDrawer />
		</>
	);
}
