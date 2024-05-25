import { Input } from '@/components/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import { GeoPointFilterTypes } from '@/constants';
import { useUpdateEffect } from '@/hooks';
import { Condition, ConditionsType } from '@/types';
import { useState } from 'react';

interface GeopointFilterItemProps {
	onUpdates: (updates: Condition) => void;
	condition?: Condition;
	onConditionChange?: (condition: ConditionsType) => void;
}

interface GeopointFilterItemState {
	longitude: number | null;
	latitude: number | null;
	distance: number | null;
	conditionType: ConditionsType;
}

export default function GeopointFilterItem({ onUpdates, condition }: GeopointFilterItemProps) {
	const [filterCondition, setFilterCondition] = useState<GeopointFilterItemState>({
		longitude: (condition?.filter as number[])?.[0] ?? null,
		latitude: (condition?.filter as number[])?.[1] ?? null,
		distance: condition?.filterFrom as number,
		conditionType: condition?.type as ConditionsType,
	});
	useUpdateEffect(() => {
		if (filterCondition) {
			onUpdates({
				filter: [filterCondition.longitude as number, filterCondition.latitude as number],
				filterFrom: filterCondition.distance,
				type: filterCondition.conditionType,
			});
		}
	}, [filterCondition]);

	useUpdateEffect(() => {
		setFilterCondition({
			longitude: (condition?.filter as number[])?.[0] ?? null,
			latitude: (condition?.filter as number[])?.[1] ?? null,
			distance: condition?.filterFrom as number,
			conditionType: condition?.type as ConditionsType,
		});
	}, [condition]);

	function onChange(value: string, key: string) {
		const number = Number(value);
		if (!isNaN(number)) {
			setFilterCondition((prev) => ({ ...prev, [key]: number }));
		}
	}
	return (
		<div className='space-y-4'>
			<Select
				onValueChange={(value) =>
					setFilterCondition((prev) => ({ ...prev, conditionType: value as ConditionsType }))
				}
				defaultValue={filterCondition.conditionType}
				key={filterCondition.conditionType}
			>
				<SelectTrigger className='w-full text-xs'>
					<SelectValue placeholder='Choose One'>
						{
							GeoPointFilterTypes.find((filter) => filter.value === filterCondition.conditionType)
								?.label
						}
					</SelectValue>
				</SelectTrigger>
				<SelectContent>
					{GeoPointFilterTypes.map((filter) => (
						<SelectItem key={filter.value} value={filter.value} className='text-xs'>
							{filter.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{filterCondition.conditionType && (
				<>
					<Input
						type='number'
						placeholder='Longitude'
						value={filterCondition.longitude ?? ''}
						onChange={(e) => onChange(e.target.value, 'longitude')}
					/>
					<Input
						type='number'
						placeholder='Latitude'
						value={filterCondition.latitude ?? ''}
						onChange={(e) => onChange(e.target.value, 'latitude')}
					/>
					<Input
						type='number'
						placeholder='Distance (km)'
						value={filterCondition.distance ?? ''}
						onChange={(e) => onChange(e.target.value, 'distance')}
					/>
				</>
			)}
		</div>
	);
}
