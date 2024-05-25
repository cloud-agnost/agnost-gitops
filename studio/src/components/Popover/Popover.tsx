'use client';

import { cn } from '@/utils';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as React from 'react';
import './popover.scss';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverClose = PopoverPrimitive.Close;

const PopoverContent = React.forwardRef<
	React.ElementRef<typeof PopoverPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
	<PopoverPrimitive.Portal>
		<PopoverPrimitive.Content
			ref={ref}
			align={align}
			sideOffset={sideOffset}
			className={cn('popover-content', className)}
			{...props}
		>
			{props.children}
			<PopoverPrimitive.Arrow className={cn('arrow')} />
		</PopoverPrimitive.Content>
	</PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverContent, PopoverTrigger, PopoverClose };
