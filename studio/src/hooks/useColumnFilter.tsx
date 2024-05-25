import { CellTypeMap } from '@/constants';
import useUtilsStore from '@/store/version/utilsStore';
import { ColumnFilterType, FieldTypes, Filters } from '@/types';
import { generateId } from '@/utils';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function useColumnFilter(entityId: string, columnName: string, type: FieldTypes) {
	const columnFilters = useUtilsStore((state) => state.columnFilters);
	const setColumnFilters = useUtilsStore((state) => state.setColumnFilters);
	const [searchParams, setSearchParams] = useSearchParams();

	const filterType = CellTypeMap[type] as Filters;
	const selectedFilter = useMemo(
		() => columnFilters?.[entityId]?.[columnName] as ColumnFilterType,
		[columnFilters?.[entityId]?.[columnName], columnName],
	);

	function applyFilter(filter: ColumnFilterType) {
		setColumnFilters(columnName, filter, entityId);
		const page = searchParams.get('page') ?? '1';
		if (page === '1') searchParams.set('filtered', generateId());
		else searchParams.set('page', '1');
		setSearchParams(searchParams);
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
	}
	return {
		selectedFilter,
		filterType,
		applyFilter,
	};
}
