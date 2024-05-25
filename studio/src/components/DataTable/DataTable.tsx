import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/Table';
import { ColumnDefWithClassName } from '@/types';
import { cn, translate } from '@/utils';
import { Cell, Table as TableType, flexRender } from '@tanstack/react-table';
import { ReactNode } from 'react';
import './sortButton.scss';
interface DataTableProps<TData> {
	table: TableType<TData>;
	className?: string;
	containerClassName?: string;
	onRowClick?: (row: TData) => void;
	onCellClick?: (cell: Cell<TData, any>) => void;
	noDataMessage?: string | ReactNode;
	headerClassName?: string;
}

export default function DataTable<TData>({
	table,
	onRowClick,
	onCellClick,
	noDataMessage = translate('general.no_results'),
	className,
	containerClassName,
	headerClassName,
}: DataTableProps<TData>) {
	const columns = table._getColumnDefs() as ColumnDefWithClassName<TData>[];
	return (
		<Table className={className} containerClassName={containerClassName}>
			{columns.map((column) => column.header).filter(Boolean).length > 0 && (
				<TableHeader className={headerClassName}>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id} className='head'>
							{headerGroup.headers.map((header, index) => {
								return (
									<TableHead
										key={header.id}
										className={cn(
											header.column.columnDef.enableSorting && 'sortable',
											columns[index].className,
										)}
										colSpan={header.colSpan}
										style={{
											width: header.getSize(),
										}}
									>
										{header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext())}
										{header.column.columnDef.enableResizing !== false && (
											<div
												{...{
													onMouseDown: header.getResizeHandler(),
													onTouchStart: header.getResizeHandler(),
													className: `resizer absolute right-0 top-0 h-full w-1 bg-border cursor-col-resize select-none touch-none ${
														header.column.getIsResizing()
															? 'opacity-100 bg-elements-strong-blue'
															: ''
													}`,
												}}
											/>
										)}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>
			)}
			<TableBody>
				{table.getRowModel().rows?.length ? (
					table.getRowModel().rows.map((row) => (
						<TableRow
							key={row.id}
							data-state={row.getIsSelected() && 'selected'}
							onClick={() => onRowClick?.(row.original)}
							className={cn(onRowClick && 'cursor-pointer', 'content')}
						>
							{row.getVisibleCells().map((cell, index) => (
								<TableCell
									key={cell.id}
									className={cn('font-sfCompact', columns[index].className)}
									style={{
										width: cell.column.getSize(),
									}}
									onClick={(e) => {
										e.stopPropagation();
										onCellClick?.(cell);
									}}
								>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
						</TableRow>
					))
				) : (
					<TableRow className='border-none'>
						<TableCell colSpan={columns.length} className='h-24 text-center'>
							{noDataMessage}
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
}
