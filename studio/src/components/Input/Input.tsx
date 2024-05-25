import { cn } from '@/utils';
import * as React from 'react';
import './input.scss';
import { VariantProps, cva } from 'class-variance-authority';

const inputVariants = cva('input', {
	variants: {
		variant: {
			sm: 'input-sm',
			md: 'input-md',
			lg: 'input-lg',
		},
	},
	defaultVariants: {
		variant: 'md',
	},
});
export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement>,
		VariantProps<typeof inputVariants> {
	type?: React.HTMLInputTypeAttribute;
	className?: string;
	error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, error, onChange, variant, ...props }, ref) => {
		const [value, setValue] = React.useState(props.value || '');

		const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
			setValue(event.target.value);
			if (onChange) {
				onChange(event);
			}
		};
		return (
			<input
				type={type}
				className={cn(inputVariants({ variant }), error && 'input-error', className)}
				ref={ref}
				autoComplete='off'
				value={value}
				onChange={handleChange}
				{...props}
			/>
		);
	},
);
Input.displayName = 'Input';

export { Input };
