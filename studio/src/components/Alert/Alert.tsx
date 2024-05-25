import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils';

import './alert.scss';
import { SuccessCheck, Warning, Error } from '@/components/icons';

const alertVariants = cva('alert', {
	variants: {
		variant: {
			success: 'alert-success',
			error: 'alert-error',
			warning: 'alert-warning',
		},
		size: {
			sm: 'alert-sm',
			md: 'alert-md',
			lg: 'alert-lg',
		},
		square: {
			true: 'avatar-square',
		},
	},
	defaultVariants: {
		variant: 'success',
		size: 'md',
	},
});

const Alert = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, size, ...props }, ref) => (
	<div
		ref={ref}
		role='alert'
		className={cn(alertVariants({ variant, size }), className)}
		{...props}
	>
		<div className='alert-icon self-start'>
			{variant === 'success' && <SuccessCheck />}
			{variant === 'warning' && <Warning />}
			{variant === 'error' && <Error />}
		</div>
		<div className='alert-body'>{props.children}</div>
	</div>
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
	({ className, ...props }, ref) => (
		<h4 ref={ref} className={cn('alert-title', className)} {...props}>
			{props.children}
		</h4>
	),
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn('alert-description', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertDescription, AlertTitle };
