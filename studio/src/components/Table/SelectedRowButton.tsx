import { Button } from '@/components/Button';
import { cn } from '@/utils';
import { Minus, Trash } from '@phosphor-icons/react';
import { useIsMutating } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InfoModal } from '../InfoModal';
interface Props {
	onDelete: () => void;
	count: number;
	className?: string;
	disabled?: boolean;
	onReset: () => void;
}
function SelectedRowButton({ onDelete, count, className, disabled, onReset }: Props) {
	const { t } = useTranslation();
	const [openInfoModal, setOpenInfoModal] = useState(false);
	const isMutating = useIsMutating();

	return (
		<>
			<div className={cn('flex items-center rounded-sm bg-lighter p-1', className)}>
				<div className='flex items-center gap-2 border-r border-button-border pr-2'>
					{count > 0 && (
						<Button
							size='sm'
							variant='primary'
							className='bg-button-primary h-1/2 p-1'
							onClick={onReset}
						>
							<Minus size={14} weight='bold' className='text-icon-default' />
						</Button>
					)}

					<span className='font-sfCompact link text-xs'>
						{t('general.selected', {
							count,
						})}
					</span>
				</div>
				<Button
					className='!p-1 ml-1'
					variant='icon'
					size='sm'
					rounded
					onClick={() => setOpenInfoModal(true)}
					disabled={disabled}
				>
					<Trash size={14} className='text-icon-base' />
				</Button>
			</div>
			<InfoModal
				isOpen={openInfoModal}
				closeModal={() => setOpenInfoModal(false)}
				title={t('general.multiDelete')}
				description={t('general.deleteDescription')}
				onConfirm={onDelete}
				loading={!!isMutating}
			/>
		</>
	);
}

export default SelectedRowButton;
