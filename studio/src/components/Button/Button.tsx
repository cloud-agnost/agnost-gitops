import { cn } from '@/utils';
import { CircleNotch } from '@phosphor-icons/react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { RefAttributes } from 'react';
import { Link, LinkProps } from 'react-router-dom';
import './Button.scss';

const buttonVariants = cva('btn', {
	variants: {
		variant: {
			primary: 'btn-primary',
			secondary: 'btn-secondary',
			destructive: 'btn-destructive',
			text: 'btn-text',
			link: 'btn-link',
			blank: 'btn-blank',
			outline: 'btn-outline',
			icon: 'btn-icon',
		},
		iconOnly: {
			true: 'btn-icon-only',
		},
		size: {
			xs: 'btn-xs',
			sm: 'btn-sm',
			md: 'btn-md',
			lg: 'btn-lg',
			xl: 'btn-xl',
			'2xl': 'btn-2xl',
			full: 'btn-full',
		},
		loading: {
			true: 'btn-loading',
		},
		rounded: {
			true: 'btn-rounded',
		},
	},
	defaultVariants: {
		variant: 'primary',
		size: 'md',
		loading: false,
		rounded: false,
	},
});

interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	label?: string;
	loading?: boolean;
	to?: string;
}

const Button = React.forwardRef<
	HTMLButtonElement & (LinkProps & RefAttributes<HTMLAnchorElement>),
	ButtonProps
>(
	(
		{
			className,
			variant,
			children,
			to,
			size,
			loading,
			rounded,
			iconOnly,
			type,
			asChild = false,
			...props
		},
		ref,
	) => {
		const Comp = asChild ? Slot : 'button';

		if (to) {
			return (
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				/* @ts-ignore */
				<Link
					to={to}
					className={cn(buttonVariants({ size, variant, loading, rounded, iconOnly, className }))}
					ref={ref}
					{...props}
				>
					{loading && <CircleNotch size={14} className='loading' />}
					{children}
				</Link>
			);
		}
		return (
			<Comp
				className={cn(buttonVariants({ size, variant, loading, rounded, iconOnly, className }))}
				ref={ref}
				type={type ?? 'button'}
				{...props}
			>
				{loading && <CircleNotch size={14} className='loading shrink-0' />}
				{children}
			</Comp>
		);
	},
);
Button.displayName = 'Button';

export default Button;
export { buttonVariants };
export type { ButtonProps };
