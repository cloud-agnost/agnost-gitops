import VerificationInput from 'react-verification-input';
import './verificationCodeInput.scss';
import { cn } from '@/utils';
import * as React from 'react';

export interface VerificationCodeInputProps {
	error?: boolean;
	onChange?: (value: string) => void;
	onComplete?: (value: string) => void;
}

const VerificationCodeInput = React.forwardRef<HTMLInputElement, VerificationCodeInputProps>(
	({ onChange, onComplete, error }, ref) => {
		return (
			<VerificationInput
				length={6}
				placeholder=''
				validChars='0-9'
				classNames={{
					container: 'code-input',
					character: cn('code-input-character', error && 'code-input-character--error'),
					characterInactive: 'code-input-character--inactive',
					characterSelected: 'code-input-character--selected',
				}}
				onChange={onChange}
				onComplete={onComplete}
				ref={ref}
			/>
		);
	},
);

VerificationCodeInput.displayName = 'VerificationCodeInput';

export { VerificationCodeInput };
