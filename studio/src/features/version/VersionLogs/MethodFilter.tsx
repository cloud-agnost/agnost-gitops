import { Button } from '@/components/Button';
import { MethodBadge } from '@/components/Endpoint';
import { ALL_HTTP_METHODS } from '@/constants';
import { CaretDown } from '@phosphor-icons/react';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/components/Dropdown';
import { useTranslation } from 'react-i18next';
import FilterLayout from './FilterLayout';
import { useEffect, useState } from 'react';
import useUtilsStore from '@/store/version/utilsStore';
import { ColumnFilterType, ConditionsType, FieldTypes, Filters } from '@/types';
import { useLocation } from 'react-router-dom';
import { cn } from '@/utils';
import { useColumnFilter } from '@/hooks';

export default function MethodFilter() {
	const { t } = useTranslation();
	const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
	const { pathname } = useLocation();
	const logType = pathname.split('/')[7];
	const { selectedFilter } = useColumnFilter(logType, 'method', FieldTypes.TEXT);
	const { setColumnFilters, clearColumnFilter } = useUtilsStore();

	function applyFilter() {
		if (selectedMethods.length === 0) {
			clearColumnFilter(logType, 'method');
			return;
		}
		const filter: ColumnFilterType = {
			conditions: [
				{
					filter: selectedMethods,
					type: ConditionsType.Includes,
				},
			],
			filterType: Filters.Text,
		};
		setColumnFilters('method', filter, logType);
	}

	function onFilterChange(option: string, checked: boolean) {
		if (checked) {
			setSelectedMethods((prev) => [...prev, option]);
		} else {
			setSelectedMethods((prev) => prev.filter((item) => item !== option));
		}
	}

	useEffect(() => {
		if (!selectedFilter) return;
		const conditions = selectedFilter?.conditions;
		setSelectedMethods(conditions[0].filter as string[]);
	}, [selectedFilter]);

	return (
		<FilterLayout onApply={applyFilter} columnName='method' onClear={() => setSelectedMethods([])}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant='blank'
						className={cn(
							'select !bg-input-background w-full text-xs',
							selectedMethods?.length > 0 ? 'text-default' : 'text-subtle',
						)}
						size='full'
					>
						{selectedMethods?.length > 0
							? t('general.selected', {
									count: selectedMethods?.length,
								})
							: t('general.chooseOne')}

						<CaretDown />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className='w-full min-w-[195px]'>
					{ALL_HTTP_METHODS.map((method) => (
						<DropdownMenuCheckboxItem
							className='bg-subtle p-2 rounded-md text-default hover:bg-subtle-hover dark:hover:bg-subtle-hover-dark'
							key={method}
							checked={selectedMethods.includes(method)}
							onCheckedChange={(checked) => onFilterChange(method, checked)}
						>
							<MethodBadge method={method} />
						</DropdownMenuCheckboxItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</FilterLayout>
	);
}
