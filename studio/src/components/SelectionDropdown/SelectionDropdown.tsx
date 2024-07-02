import { Button } from '@/components/Button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandSeparator,
} from '@/components/Command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/Popover';
import { Organization } from '@/types';
import { Project } from '@/types/project';
import { cn } from '@/utils';
import { CaretUpDown, Check } from '@phosphor-icons/react';
import { MouseEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '../Avatar';
import { SearchInput } from '../SearchInput';
interface SelectionLabelProps {
	selectedData: Organization | Project;
	onClick?: () => void;
}

interface SelectionDropdownProps<T extends Organization | Project> {
	selectedData: T;
	data: T[];
	onSelect: (data: T) => void;
	onClick: () => void;
	children: React.ReactNode;
}

export default function SelectionDropdown<T extends Organization | Project>({
	selectedData,
	data,
	onSelect,
	onClick,
	children,
}: SelectionDropdownProps<T>) {
	const [search, setSearch] = useState('');
	const { t } = useTranslation();
	const filteredData = useMemo(() => {
		if (!search) return data;
		return data.filter((d) => RegExp(new RegExp(search, 'i')).exec(d.name));
	}, [data, search]);

	function handleSelect(data: T) {
		onSelect(data);
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
	}
	return (
		<Popover>
			<div className='w-[210px] h-10 relative'>
				<SelectionLabel onClick={onClick} selectedData={selectedData} />
				<PopoverTrigger asChild>
					<Button variant='icon' size='sm' className='absolute z-50 top-0 -right-1' rounded>
						<CaretUpDown size={20} />
					</Button>
				</PopoverTrigger>
			</div>
			<PopoverContent align='end' className='bg-subtle w-[250px]'>
				{data.length > 5 && (
					<SearchInput
						placeholder={t('organization.select') as string}
						value={search}
						onSearch={setSearch}
					/>
				)}
				{filteredData.map((d) => (
					<div className='px-2 py-1.5 hover:bg-lighter' key={d._id}>
						<Button variant='blank' onClick={() => handleSelect(d)} size='full'>
							<SelectionLabel selectedData={d} />
							<Check
								size={16}
								className={cn(
									'text-icon-base',
									selectedData?._id === d?._id ? 'opacity-100 ' : 'opacity-0',
								)}
								weight='bold'
							/>
						</Button>
					</div>
				))}
				{children && <div>{children}</div>}
				{/* <CommandEmpty>{t('organization.empty')}</CommandEmpty> */}
			</PopoverContent>
		</Popover>
	);
}

function SelectionLabel({ selectedData, onClick }: SelectionLabelProps) {
	function openAppSettings(e: MouseEvent<HTMLButtonElement>) {
		if (onClick) {
			e.stopPropagation();
			onClick();
		}
	}

	return (
		<Button
			variant='blank'
			size='sm'
			className='flex items-center px-1.5 h-full w-full transition font-normal rounded-sm hover:bg-wrapper-background-hover dark:hover:bg-button-secondary-hover'
			onClick={openAppSettings}
		>
			<Avatar className='mr-2' size='sm' square>
				<AvatarImage src={selectedData?.pictureUrl} alt={selectedData?.name} />
				<AvatarFallback name={selectedData?.name} color={selectedData?.color as string} />
			</Avatar>
			<div className='text-left flex-1  h-full flex flex-col justify-center'>
				<div className='text-xs leading-none text-default whitespace-nowrap truncate max-w-[80%]'>
					{selectedData?.name}
				</div>
				<div className='text-xs text-subtle'>{selectedData?.role}</div>
			</div>
		</Button>
	);
}
