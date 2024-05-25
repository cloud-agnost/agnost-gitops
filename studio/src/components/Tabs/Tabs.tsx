import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/utils';
import './tabs.scss';

const Tabs = TabsPrimitive.Root;

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
	align?: 'start' | 'center' | 'end';
	title?: string;
	containerClassName?: string;
}
const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
	({ align = 'start', title, className, containerClassName, ...props }, ref) => {
		return (
			<div className={cn(containerClassName, 'tab-list-container', title ? 'has-title' : align)}>
				{title && <h2 className='tab-list-title'>{title}</h2>}
				<TabsPrimitive.List ref={ref} className={cn('tab-list', className)} {...props} />
			</div>
		);
	},
);
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Trigger ref={ref} className={cn('tab-trigger', className)} {...props} />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Content ref={ref} className={cn('tab-content', className)} {...props} />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
