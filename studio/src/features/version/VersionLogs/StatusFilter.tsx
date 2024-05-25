import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import { useColumnFilter } from '@/hooks';
import useUtilsStore from '@/store/version/utilsStore';
import { ColumnFilterType, ConditionsType, FieldTypes, Filters } from '@/types';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import FilterLayout from './FilterLayout';
import { capitalize } from 'lodash';
export default function StatusFilter() {
	const { pathname } = useLocation();
	const logType = pathname.split('/')[7];
	const { selectedFilter } = useColumnFilter(logType, 'status', FieldTypes.TEXT);
	const [status, setStatus] = useState(capitalize(selectedFilter?.conditions[0]?.filter as string));
	const { setColumnFilters } = useUtilsStore();

	function applyFilter() {
		let conditions: ColumnFilterType['conditions'];
		if (logType === 'endpoint') {
			conditions =
				status === 'Success'
					? [
							{
								filter: 200,
								type: ConditionsType.GreaterThanOrEqual,
							},
							{
								filter: 399,
								type: ConditionsType.LessThanOrEqual,
							},
						]
					: [
							{
								filter: 400,
								type: ConditionsType.GreaterThanOrEqual,
							},
						];
		} else {
			conditions = [
				{
					filter: status.toLowerCase(),
					type: ConditionsType.Equals,
				},
			];
		}
		const filter: ColumnFilterType = {
			conditions,
			filterType: Filters.Text,
		};
		setColumnFilters('status', filter, logType);
	}

	useEffect(() => {
		if (!selectedFilter) return;
		const conditions = selectedFilter?.conditions;

		setStatus(capitalize(conditions[0].filter as string));
	}, [selectedFilter]);

	return (
		<FilterLayout onApply={applyFilter} columnName='status'>
			<Select
				defaultValue={capitalize(selectedFilter?.conditions[0]?.filter as string)}
				onValueChange={(value) => setStatus(value)}
			>
				<SelectTrigger className='w-full text-xs'>
					<SelectValue placeholder='Select Status' />
				</SelectTrigger>

				<SelectContent>
					{['Success', 'Error'].map((status) => (
						<SelectItem key={status} value={status} className='max-w-full text-xs'>
							{status}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</FilterLayout>
	);
}
