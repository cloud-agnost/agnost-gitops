import { Button } from '@/components/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import { BOOLEAN_FILTERS } from '@/constants';
import { useColumnFilter } from '@/hooks';
import { ConditionsType, FilterProps } from '@/types';
import _ from 'lodash';
import { useEffect, useState } from 'react';

export default function BooleanFilter({ type, columnName, entityId }: FilterProps) {
	const { filterType, selectedFilter, applyFilter } = useColumnFilter(entityId, columnName, type);
	const [filter, setFilter] = useState(selectedFilter);

	const onFilterChange = (value: string) => {
		setFilter({
			filterType,
			conditions: [
				{
					type: ConditionsType.Equals,
					filter: value === 'true',
				},
			],
		});
	};

	useEffect(() => {
		setFilter(selectedFilter);
	}, [selectedFilter]);

	return (
		<>
			<Select
				defaultValue={filter?.conditions[0]?.filter?.toString()}
				onValueChange={onFilterChange}
			>
				<SelectTrigger className='w-full text-xs'>
					<SelectValue placeholder='Choose One' />
				</SelectTrigger>

				<SelectContent>
					{BOOLEAN_FILTERS?.map((filter) => (
						<SelectItem key={filter.value} value={filter.value} className='text-xs'>
							{filter.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{!_.isNil(filter?.conditions[0]?.filter) ? (
				<Button variant='primary' onClick={() => applyFilter(filter)} size='full'>
					Apply
				</Button>
			) : null}
		</>
	);
}
