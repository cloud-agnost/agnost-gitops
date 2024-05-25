import { ColumnDefWithClassName } from '@/types';
import {
	ColumnFiltersState,
	SortingState,
	TableOptions,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import _ from 'lodash';
import { useState } from 'react';

type UseTableProps<TData> = Omit<TableOptions<TData>, 'data' | 'columns' | 'getCoreRowModel'> & {
	data: TData[];
	columns: ColumnDefWithClassName<TData>[];
};

export default function useTable<TData>({ data, columns, ...props }: UseTableProps<TData>) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [rowSelection, setRowSelection] = useState({});
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const table = useReactTable({
		data,
		columns,
		columnResizeMode: 'onChange',
		...props,
		getCoreRowModel: getCoreRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onRowSelectionChange: setRowSelection,
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		enableRowSelection(row) {
			const cell = row.getAllCells().find((item) => item.column.id === 'select');
			if (!cell) return false;
			const meta = cell.column.columnDef?.meta;
			if (!meta) return true;

			const { disabled } = cell.column.columnDef.meta as Record<
				string,
				{ key: string; value: string }[]
			>;

			if (!disabled) return true;

			return !disabled.some((item) => _.get(row.original, item.key) === item.value);
		},
		state: {
			sorting,
			rowSelection,
			columnFilters,
		},
	});

	return table;
}
