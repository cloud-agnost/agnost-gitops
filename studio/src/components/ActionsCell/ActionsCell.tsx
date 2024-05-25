import { Button } from '@/components/Button';
import { Trash, PencilSimple } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../Tooltip';
interface ActionCellProps<T> {
	original: T;
	canEdit: boolean;
	canDelete?: boolean;
	children?: React.ReactNode;
	disabled?: boolean;
	onEdit?: (item: T) => void;
	onDelete?: (item: T) => void;
}

function ActionsCell<T>({
	original,
	onEdit,
	onDelete,
	canEdit,
	canDelete,
	children,
	disabled,
}: ActionCellProps<T>) {
	const { t } = useTranslation();

	return (
		<div className='flex items-center'>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant='icon'
							size='sm'
							rounded
							onClick={() => onEdit?.(original)}
							disabled={disabled || !canEdit}
						>
							<PencilSimple size={20} />
						</Button>
					</TooltipTrigger>
					<TooltipContent>{t('general.edit')}</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			{children ?? (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant='icon'
								rounded
								size='sm'
								onClick={() => onDelete?.(original)}
								disabled={disabled || !canDelete}
							>
								<Trash size={20} />
							</Button>
						</TooltipTrigger>
						<TooltipContent>{t('general.delete')}</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
		</div>
	);
}

export default ActionsCell;
