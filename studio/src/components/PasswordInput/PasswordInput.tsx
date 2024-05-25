import { Input } from '@/components/Input';
import { cn, copyToClipboard } from '@/utils';
import { Copy, Eye, EyeSlash } from '@phosphor-icons/react';
import * as React from 'react';
import { useState } from 'react';
import { Button } from '../Button';
import './password-input.scss';

export interface PasswordInputProps extends React.ComponentPropsWithoutRef<'input'> {
	className?: string;
	error?: boolean;
	disableShowPassword?: boolean;
	copyable?: boolean;
	readOnly?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
	(
		{
			className,
			value,
			placeholder,
			error,
			readOnly,
			disableShowPassword = false,
			copyable,
			...props
		},
		ref,
	) => {
		const [inputValue, setInputValue] = useState(value);
		const [showPassword, setShowPassword] = useState(false);

		React.useEffect(() => {
			setInputValue(value);
		}, [value]);

		return (
			<div className={cn('password-input-wrapper', className)} {...props}>
				<Input
					ref={ref}
					defaultValue={inputValue}
					value={inputValue}
					readOnly={readOnly}
					onChange={(e) => setInputValue(e.target.value)}
					error={error}
					type={showPassword ? 'text' : 'password'}
					placeholder={placeholder}
					className='password-input'
					autoComplete='new-password'
				/>
				<div className='password-input-button flex items-center'>
					{copyable && (
						<Button
							className='!p-1'
							onClick={() => copyToClipboard(inputValue as string)}
							variant='icon'
							size='sm'
							rounded
						>
							<Copy size={14} />
						</Button>
					)}
					<Button
						className='!p-1'
						onClick={() => setShowPassword(!showPassword)}
						variant='icon'
						size='sm'
						rounded
						disabled={disableShowPassword}
					>
						{showPassword ? <EyeSlash size={14} /> : <Eye size={14} />}
					</Button>
				</div>
			</div>
		);
	},
);
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
