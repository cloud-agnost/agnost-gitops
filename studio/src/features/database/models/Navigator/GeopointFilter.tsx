import { Button } from '@/components/Button';
import { useColumnFilter } from '@/hooks';
import { Condition, FilterProps, Operators } from '@/types';
import { useEffect, useState } from 'react';
import GeopointFilterItem from './GeopointFilterItem';
import OperatorSelect from './OperatorSelect';
import _ from 'lodash';
import useModelStore from '@/store/database/modelStore';

export default function GeopointFilter({ columnName, type }: FilterProps) {
	const model = useModelStore((state) => state.model);
	const { selectedFilter, filterType, applyFilter } = useColumnFilter(model._id, columnName, type);
	const [filter, setFilter] = useState(selectedFilter);
	const updateFilterConditions = (conditionIndex: number, updates: Condition) => {
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
		<div className='space-y-6'>
			<GeopointFilterItem
				onUpdates={(updates) => updateFilterConditions(0, updates)}
				condition={filter?.conditions[0]}
			/>

			{!_.isNil(filter?.conditions[0]?.filter) && (
				<OperatorSelect
					defaultValue={filter?.operator ?? Operators.None}
					onOperatorChange={updateOperator}
				/>
			)}

			{filter?.operator && filter?.operator !== Operators.None && (
				<GeopointFilterItem
					onUpdates={(updates) => updateFilterConditions(1, updates)}
					condition={filter?.conditions[1]}
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
