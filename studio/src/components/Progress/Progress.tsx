import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@/utils';

const Progress = React.forwardRef<
	React.ElementRef<typeof ProgressPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
	<ProgressPrimitive.Root
		ref={ref}
		className={cn('relative h-2 w-full overflow-hidden rounded-full bg-subtle', className)}
		{...props}
	>
		<ProgressPrimitive.Indicator
			className='h-full w-full flex-1 bg-brand-primary transition-all'
			style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
		>
			<span className='sr-only'>{value}%</span>
		</ProgressPrimitive.Indicator>
	</ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
