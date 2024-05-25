import { Button } from '@/components/Button';
import { useColumnFilter } from '@/hooks';
import { Condition, FilterProps, Operators } from '@/types';
import { useEffect, useState } from 'react';
import ColumnFilter from './ColumnFilter';
import OperatorSelect from './OperatorSelect';
import _ from 'lodash';

export default function DefaultFilter({ type, columnName, entityId, description }: FilterProps) {
	const { selectedFilter, filterType, applyFilter } = useColumnFilter(entityId, columnName, type);
	const [filter, setFilter] = useState(selectedFilter);
	const updateFilterCondition = (conditionIndex: number, updates: Partial<Condition>) => {
		const initialConditions = filter?.conditions || [];
		let conditions: Condition[] = [];
		if (conditionIndex >= initialConditions.length) {
			conditions = new Array(conditionIndex + 1).fill({}).map((val, index) => {
				return index === conditionIndex ? { ...val, ...updates } : initialConditions[index] || {};
			});
		} else {
			conditions = initialConditions.map((condition, index) => {
				if (index === conditionIndex) {
					return { ...condition, ...updates };
				}
				return condition;
			});
		}
		setFilter((prev) => ({
			...prev,
			filterType,
			conditions,
		}));
	};

	function updateOperator(operator: Operators) {
		if (operator === Operators.None) {
			setFilter((prev) => ({
				filterType,
				conditions: [prev.conditions[0]],
			}));
			return;
		}
		setFilter((prev) => ({ ...prev, operator }));
	}

	useEffect(() => {
		setFilter(selectedFilter);
	}, [selectedFilter]);

	return (
		<div className='space-y-4'>
			<ColumnFilter
				onFilterChange={(filter) => updateFilterCondition(0, filter)}
				type={type}
				condition={filter?.conditions[0]}
				description={description}
			/>
			{!_.isNil(filter?.conditions[0]?.filter) && (
				<OperatorSelect
					defaultValue={filter?.operator ?? Operators.None}
					onOperatorChange={(operator) => updateOperator(operator)}
				/>
			)}

			{filter?.operator && filter?.operator !== Operators.None && (
				<ColumnFilter
					onFilterChange={(filter) => updateFilterCondition(1, filter)}
					type={type}
					condition={filter?.conditions[1]}
					description={description}
				/>
			)}

			{!_.isNil(filter?.conditions[0]?.filter) ? (
				<Button variant='primary' onClick={() => applyFilter(filter)} size='full'>
					Apply
				</Button>
			) : null}
		</div>
	);
}
