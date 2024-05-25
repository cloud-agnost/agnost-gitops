import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import './switch.scss';
import { cn } from '@/utils';
import { Lock } from '@phosphor-icons/react';

const Switch = React.forwardRef<
	React.ElementRef<typeof SwitchPrimitives.Root>,
	React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
	<SwitchPrimitives.Root className={cn('switch-root', className)} ref={ref} {...props}>
		<SwitchPrimitives.Thumb className={cn('switch-thumb cursor-pointer')} />
		<Lock className='switch-lock' />
	</SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
