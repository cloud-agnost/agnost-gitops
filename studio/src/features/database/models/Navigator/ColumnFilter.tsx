import { Input } from '@/components/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import {
	CellMaskMap,
	CellTypeMap,
	DATE_FILTERS,
	ID_FILTERS,
	MONGODB_FILTERS,
	NUMBER_FILTERS,
	TEXT_FILTERS,
} from '@/constants';
import { useDebounce, useUpdateEffect } from '@/hooks';
import useDatabaseStore from '@/store/database/databaseStore';
import { Condition, ConditionsType, FieldTypes, Filters, ResourceInstances } from '@/types';
import { InputMask } from '@react-input/mask';
import React, { useMemo, useState } from 'react';

export default function ColumnFilter({
	onFilterChange,
	type,
	condition,
	description,
}: {
	onFilterChange: (filter: any) => void;
	condition: Condition;
	type: FieldTypes;
	description?: string;
}) {
	const [filterCondition, setFilterCondition] = useState({
		filter: condition?.filter ?? '',
		type: condition?.type,
	});
	const searchTerm = useDebounce(filterCondition.filter as string, 500);
	const db = useDatabaseStore((state) => state.database);
	const filterType = useMemo(() => CellTypeMap[type], [type]);
	const InputComp = filterType === Filters.Date ? InputMask : Input;

	const database = useDatabaseStore((state) => state.database);
	const filters = useMemo(() => {
		if (type === FieldTypes.ID) {
			return ID_FILTERS;
		}
		let filters = [];

		if (filterType === Filters.Date) filters = DATE_FILTERS;
		else if (filterType === Filters.Number) filters = NUMBER_FILTERS;
		else filters = TEXT_FILTERS;

		if (database.type === ResourceInstances.MongoDB) {
			filters = filters.concat(MONGODB_FILTERS);
		}

		return filters;
	}, [filterType, database.type]);

	const inputProps = useMemo(() => {
		if (filterType === Filters.Date) {
			return {
				mask: CellMaskMap[type]?.mask,
				replacement: CellMaskMap[type]?.replacement,
				seperate: true,
				component: Input,
			};
		}
		return {};
	}, [filterType, type]);

	function onChange(e: React.ChangeEvent<HTMLInputElement>) {
		const { value } = e.target;
		if (filterType === Filters.Number) {
			if (value === '' || !isNaN(Number(value))) {
				setFilterCondition((prev) => ({ ...prev, filter: Number(value) }));
			}
		} else {
			setFilterCondition((prev) => ({ ...prev, filter: value }));
		}
	}

	useUpdateEffect(() => {
		if (filterCondition) {
			onFilterChange(filterCondition);
		}
	}, [searchTerm, filterCondition.type]);

	useUpdateEffect(() => {
		setFilterCondition({
			filter: condition?.filter ?? '',
			type: condition?.type,
		});
	}, [condition]);

	return (
		<>
			<Select
				onValueChange={(value) =>
					setFilterCondition((prev) => ({ ...prev, type: value as ConditionsType }))
				}
				value={filterCondition.type}
				key={filterCondition.type}
			>
				<SelectTrigger className='w-full text-xs'>
					<SelectValue placeholder='Choose One' key={filterCondition.type}>
						{filters.find((filter) => filter.value === filterCondition.type)?.label}
					</SelectValue>
				</SelectTrigger>
				<SelectContent>
					{filters.map((filter) => (
						<SelectItem key={filter.value} value={filter.value} className='text-xs font-normal'>
							{filter.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{filterCondition.type &&
				![
					ConditionsType.IsEmpty,
					ConditionsType.IsNotEmpty,
					ConditionsType.IsNull,
					ConditionsType.IsNotNull,
				].includes(filterCondition.type as ConditionsType) && (
					<div className='space-y-1'>
						<InputComp
							{...inputProps}
							type={
								filterType === Filters.Number ||
								(type === FieldTypes.ID && db.type !== ResourceInstances.MongoDB)
									? 'number'
									: 'text'
							}
							value={filterCondition.filter as string}
							onChange={onChange}
							placeholder='Filter'
						/>
						{description && <p className='text-[10px] text-subtle text-balance'>{description}</p>}
					</div>
				)}
		</>
	);
}
