import React from 'react';
interface SortableContainerProps {
	title: string;
	children?: React.ReactNode;
	actions?: React.ReactNode;
}

export default function SortableContainer({ title, children, actions }: SortableContainerProps) {
	return (
		<div className='p-4 border rounded-lg flex flex-col gap-4'>
			<div className='flex justify-between items-center'>
				<span className='uppercase font-sfCompact text-subtle text-xs font-normal'>{title}</span>
				{actions}
			</div>
			{children}
		</div>
	);
}
