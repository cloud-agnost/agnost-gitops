import { Button } from '@/components/Button';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/components/Dropdown';
import { useColumnFilter } from '@/hooks';
import useModelStore from '@/store/database/modelStore';
import useUtilsStore from '@/store/version/utilsStore';
import { ConditionsType, FilterProps } from '@/types';
import { cn, generateId } from '@/utils';
import { CaretDown } from '@phosphor-icons/react';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
interface EnumFilterProps extends FilterProps {
	options: string[];
}
export default function EnumFilter({ columnName, options, type }: EnumFilterProps) {
	const { t } = useTranslation();
	const { setColumnFilters, clearColumnFilter } = useUtilsStore();
	const { model } = useModelStore();
	const { selectedFilter, filterType } = useColumnFilter(model._id, columnName, type);
	const [filter, setFilter] = useState(selectedFilter);
	const [searchParams, setSearchParams] = useSearchParams();
	function onFilterChange(newFilter: string, checked: boolean) {
		const conditions = (filter?.conditions?.[0]?.filter as string[]) ?? [];
		if (checked) {
			conditions.push(newFilter);
		} else {
			const index = conditions.indexOf(newFilter);
			conditions.splice(index, 1);
		}
		setFilter((prev) => ({
			...prev,
			filterType,
			conditions: [{ filter: conditions, type: ConditionsType.Includes }],
		}));
	}

	function applyFilter() {
		if ((filter?.conditions?.[0]?.filter as string[])?.length === 0) {
			clearColumnFilter(model._id, columnName);
			return;
		} else {
			setColumnFilters(columnName, filter, model._id);
		}
		const page = searchParams.get('page') ?? '1';
		if (page === '1') searchParams.set('filtered', generateId());
		else searchParams.set('page', '1');
		setSearchParams(searchParams);
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
	}

	useEffect(() => {
		setFilter(selectedFilter);
	}, [selectedFilter]);

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild className='w-full'>
					<Button
						variant='blank'
						className={cn(
							'select !bg-input-background w-full text-xs',
							(filter?.conditions?.[0]?.filter as string[])?.length > 0
								? 'text-default'
								: 'text-subtle',
						)}
						size='full'
					>
						{(filter?.conditions?.[0]?.filter as string[])?.length > 0
							? t('general.selected', {
									count: (filter?.conditions?.[0]?.filter as string[])?.length,
								})
							: t('general.chooseOne')}

						<CaretDown />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className='w-full min-w-[200px]'>
					{options.map((option) => (
						<DropdownMenuCheckboxItem
							key={option}
							checked={(filter?.conditions?.[0]?.filter as string[])?.includes(option)}
							onCheckedChange={(checked) => onFilterChange(option, checked)}
						>
							{option}
						</DropdownMenuCheckboxItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
			{!_.isNil(filter?.conditions[0]?.filter) ? (
				<Button variant='primary' onClick={applyFilter} size='full'>
					Apply
				</Button>
			) : null}
		</>
	);
}
