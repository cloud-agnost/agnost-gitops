import { cn } from '@/utils/';
import { CaretDown, Check } from '@phosphor-icons/react';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as React from 'react';
import './select.scss';

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

interface SelectTriggerProps
	extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
	className?: string;
	error?: boolean;
}

const SelectTrigger = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Trigger>,
	SelectTriggerProps
>(({ className, children, error, ...props }, ref) => (
	<SelectPrimitive.Trigger
		ref={ref}
		className={cn('select !bg-input-background', error && 'border-error', className)}
		{...props}
	>
		{children}
		<SelectPrimitive.Icon asChild>
			<CaretDown className='h-4 w-4' />
		</SelectPrimitive.Icon>
	</SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
	<SelectPrimitive.Portal>
		<SelectPrimitive.Content
			ref={ref}
			className={cn('select-content', position === 'popper' && 'translate-y-1', className)}
			position={position}
			{...props}
		>
			<SelectPrimitive.Viewport
				className={cn('select-viewport', position === 'popper' && 'select-viewport-popper')}
			>
				{children}
			</SelectPrimitive.Viewport>
		</SelectPrimitive.Content>
	</SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Label>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.Label ref={ref} className={cn('select-label', className)} {...props} />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

type SelectItemProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
	hideIndicator?: boolean;
};

const SelectItem = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Item>, SelectItemProps>(
	({ className, children, hideIndicator, ...props }, ref) => (
		<SelectPrimitive.Item
			ref={ref}
			className={cn('select-item', hideIndicator && 'no-indicator', className)}
			{...props}
		>
			<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
			{!hideIndicator && (
				<span className='flex w-full h-full items-center justify-end'>
					<SelectPrimitive.ItemIndicator>
						<Check className='h-4 w-4' />
					</SelectPrimitive.ItemIndicator>
				</span>
			)}
		</SelectPrimitive.Item>
	),
);
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Separator>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.Separator
		ref={ref}
		className={cn('h-[1px] my-1 bg-border -mx-1', className)}
		{...props}
	/>
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
};
