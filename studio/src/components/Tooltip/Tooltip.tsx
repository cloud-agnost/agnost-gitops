import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/utils';

const TooltipProvider = TooltipPrimitive.Provider;

type TooltipProps = React.ComponentPropsWithoutRef<typeof TooltipProvider> &
	React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>;

function Tooltip({
	children,
	delayDuration,
	skipDelayDuration,
	disableHoverableContent,
	...rest
}: TooltipProps) {
	return (
		<TooltipProvider
			delayDuration={delayDuration}
			skipDelayDuration={skipDelayDuration}
			disableHoverableContent={disableHoverableContent}
		>
			<TooltipPrimitive.Root {...rest}>{children}</TooltipPrimitive.Root>
		</TooltipProvider>
	);
}

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
	React.ElementRef<typeof TooltipPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
	<TooltipPrimitive.Content
		ref={ref}
		sideOffset={sideOffset}
		className={cn(
			'z-50 overflow-hidden rounded-md bg-wrapper-background-light px-3 py-1.5 text-xs text-default',
			className,
		)}
		{...props}
	/>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
