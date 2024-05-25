import React, { useState } from 'react';
import { cn } from '@/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	showCount?: boolean;
	error?: boolean;
	className?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, showCount, error, ...props }, ref) => {
		const [count, setCount] = useState(0);
		return (
			<div className='relative'>
				<textarea
					className={cn(
						'flex min-h-[60px] w-full rounded-md border border-input-border bg-input-background px-3 py-2 text-sm text-default shadow-sm placeholder:text-subtle focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-input-disabled-background disabled:border-input-disabled-border',
						className,
						error && 'border-error',
						// count === props.maxLength && ‘border-error’,
					)}
					ref={ref}
					onInput={(e) => setCount(e.currentTarget.value.length)}
					{...props}
				/>
				{showCount && props.maxLength && (
					<span className='absolute bottom-1 right-3 text-xs text-subtle'>
						{count} / {props.maxLength}
					</span>
				)}
			</div>
		);
	},
);

Textarea.displayName = 'Textarea';

export { Textarea };
