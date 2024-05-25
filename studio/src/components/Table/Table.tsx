import { cn } from '@/utils';
import { CircleNotch } from '@phosphor-icons/react';
import * as React from 'react';
import './table.scss';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
	containerClassName?: string;
	style?: React.CSSProperties;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
	({ className, containerClassName, style, ...props }, ref) => (
		<div className={cn('table-container', containerClassName)} style={style}>
			<table ref={ref} className={cn('table', className)} style={style} {...props} />
		</div>
	),
);

Table.displayName = 'Table';

const TableLoading = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div
			className={cn('p-2 justify-center flex items-center text-default', className)}
			ref={ref}
			{...props}
		>
			<CircleNotch size={25} className='loading' />
		</div>
	),
);

TableLoading.displayName = 'TableLoading';

const TableHeader = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<thead ref={ref} className={cn('table-header', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<tbody ref={ref} className={cn('table-body', className)} {...props} />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<tfoot ref={ref} className={cn('table-footer', className)} {...props} />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
	({ className, ...props }, ref) => (
		<tr ref={ref} className={cn('table-row', className)} {...props} />
	),
);
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
	HTMLTableCellElement,
	React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
	<th ref={ref} className={cn('table-head ', className)} {...props} />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
	HTMLTableCellElement,
	React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, children, ...props }, ref) => {
	return (
		<td ref={ref} className={cn('table-cell', className)} {...props}>
			{children}
		</td>
	);
});
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
	HTMLTableCaptionElement,
	React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
	<caption ref={ref} className={cn('table-caption', className)} {...props} />
));
TableCaption.displayName = 'TableCaption';

export {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableLoading,
	TableRow,
};
