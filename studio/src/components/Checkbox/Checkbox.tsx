import { Label } from '@/components/Label';
import { cn } from '@/utils';
import { Check } from '@phosphor-icons/react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as React from 'react';
import './checkbox.scss';

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
	className?: string;
	id?: string;
	label?: string;
}

const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
	({ className, id, label, ...props }, ref) => (
		<div className='checkbox-wrapper'>
			<CheckboxPrimitive.Root
				ref={ref}
				id={id}
				className={cn('checkbox peer', className)}
				{...props}
			>
				<CheckboxPrimitive.Indicator className={cn('checkbox-indicator')}>
					<Check size={14} />
				</CheckboxPrimitive.Indicator>
			</CheckboxPrimitive.Root>
			{label && (
				<Label htmlFor={id} className='checkbox-label'>
					{label}
				</Label>
			)}
		</div>
	),
);
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
