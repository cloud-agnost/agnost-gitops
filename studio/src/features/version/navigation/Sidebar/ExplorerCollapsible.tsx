import { Button } from '@/components/Button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/Collapsible';
import { cn } from '@/utils';
import { CaretRight } from '@phosphor-icons/react';
import React from 'react';

interface ExplorerCollapsibleProps {
	open: boolean;
	onOpenChange: () => void;
	children: React.ReactNode;
	trigger?: React.ReactNode;
	className?: string;
}
export function ExplorerCollapsible({
	open,
	onOpenChange,
	children,
	trigger,
	className,
	...props
}: ExplorerCollapsibleProps) {
	return (
		<Collapsible
			open={open}
			onOpenChange={onOpenChange}
			className={cn('w-full', className)}
			{...props}
		>
			{trigger}
			<CollapsibleContent>{children}</CollapsibleContent>
		</Collapsible>
	);
}
export function ExplorerCollapsibleTrigger({
	title,
	children,
	active,
	onClick,
}: {
	title?: React.ReactNode;
	children?: React.ReactNode;
	active: boolean;
	onClick?: () => void;
}) {
	return (
		<div className='hover:bg-subtle group h-6 flex items-center justify-center group'>
			<div className='flex items-center justify-start gap-1 w-full pl-1'>
				<CollapsibleTrigger asChild>
					<Button
						variant='blank'
						className={cn(!children && 'flex-1', 'gap-1')}
						size='sm'
						onClick={onClick}
					>
						<CaretRight
							size={14}
							className={cn(
								'transition-transform duration-200 text-subtle group-hover:text-default',
								active && 'rotate-90 text-default',
							)}
						/>
						{title && title}
					</Button>
				</CollapsibleTrigger>
				{children && <div className='flex-1 flex justify-between items-center'>{children}</div>}
			</div>
		</div>
	);
}
