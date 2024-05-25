import { APIError } from '@/types';
import { Alert, AlertDescription, AlertTitle } from 'components/Alert';
import { Button } from '@/components/Button';
import { Input } from 'components/Input';
import { KeyboardEvent, ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../Dialog';
import './confirmationModal.scss';

interface ConfirmationModalProps {
	error?: APIError | null;
	title: string;
	alertTitle?: string | null;
	alertDescription?: string | null;
	description: string | ReactNode;
	closable?: boolean;
	closeButtonText?: string;
	confirmCode: string;
	onConfirm: () => void;
	loading: boolean;
	confirmButtonText?: string | null;
	isOpen: boolean;
	closeModal: () => void;
	className?: string;
}
export default function ConfirmationModal({
	loading,
	error,
	closeModal,
	isOpen,
	description,
	title,
	onConfirm,
	closable,
	className,
	confirmCode,
	closeButtonText,
	confirmButtonText,
	alertDescription,
	alertTitle,
}: ConfirmationModalProps) {
	const { t } = useTranslation();
	const [code, setCode] = useState<string>('');
	const showAlert = alertTitle ?? alertDescription;

	useEffect(() => {
		if (!isOpen) setCode('');
	}, [isOpen]);

	function checkPressEnter(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key === 'Enter' && code === confirmCode) onConfirm();
	}

	return (
		<Dialog open={isOpen} onOpenChange={closeModal}>
			<DialogContent className={className}>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<div className='confirmation-modal'>
					{error ? (
						<Alert variant='error'>
							{alertTitle && <AlertTitle>{error.error}</AlertTitle>}
							{alertDescription && <AlertDescription>{error.details}</AlertDescription>}
						</Alert>
					) : (
						showAlert && (
							<Alert variant='warning'>
								{alertTitle && <AlertTitle>{alertTitle}</AlertTitle>}
								{alertDescription && <AlertDescription>{alertDescription}</AlertDescription>}
							</Alert>
						)
					)}
					<p className='confirmation-modal-desc'>{description}</p>
					{confirmCode && (
						<Input
							value={code}
							placeholder={t('general.enter_confirmation_code_here') ?? ''}
							maxLength={confirmCode.length}
							onChange={(e) => setCode(e.target.value)}
							onKeyDown={checkPressEnter}
						/>
					)}
					<div className='confirmation-modal-actions'>
						{closable && (
							<Button onClick={closeModal} variant='text' size='lg'>
								{closeButtonText ?? t('general.cancel')}
							</Button>
						)}
						<Button loading={loading} onClick={onConfirm} size='lg' disabled={code !== confirmCode}>
							{confirmButtonText ?? t('general.delete')}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
