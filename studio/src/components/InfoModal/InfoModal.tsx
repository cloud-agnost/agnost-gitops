import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '../Dialog';

import { Button, buttonVariants } from '@/components/Button';
import { ElementType, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import './infoModal.scss';
import { cn } from '@/utils';
import { Warning } from '../icons';

interface InfoModalProps {
	title: string;
	description: string;
	isOpen: boolean;
	closeModal: () => void;
	className?: string;
	onConfirm: () => void;
	action?: ReactNode;
	icon?: any;
	loading?: boolean;
}
export default function InfoModal({
	closeModal,
	className,
	isOpen,
	description,
	title,
	onConfirm,
	action,
	icon,
	loading,
}: InfoModalProps) {
	const { t } = useTranslation();
	const Icon = (icon ?? Warning) as ElementType;
	return (
		<Dialog open={isOpen} onOpenChange={closeModal}>
			<DialogContent className={cn('space-y-4', className)}>
				<DialogHeader className='flex flex-col items-center gap-2'>
					<Icon className='text-icon-secondary w-20 h-20' />
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription className='text-center'>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter className='flex justify-center'>
					<DialogClose
						className={cn(buttonVariants({ variant: 'text', size: 'lg' }))}
						onClick={closeModal}
					>
						{t('general.cancel')}
					</DialogClose>
					{action}
					<Button onClick={onConfirm} size='lg' loading={loading}>
						{t('general.ok')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
