import { Popover, PopoverContent, PopoverTrigger } from '@/components/Popover';
import { cn } from '@/utils';
import { Trash, X } from '@phosphor-icons/react';
import { Align } from '@radix-ui/react-popper';
import { MutationFunction, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../Tooltip';
import { APIError } from '@/types';
import { useToast } from '@/hooks';
interface TableConfirmationProps {
	onConfirm: MutationFunction<unknown, void>;
	disabled?: boolean;
	title: string;
	description: string;
	align?: Align;
	contentClassName?: string;
	hasPermission: boolean;
	icon?: React.ReactNode;
	tooltip?: string;
}

export function TableConfirmation({
	onConfirm,
	title,
	description,
	contentClassName,
	align = 'end',
	hasPermission,
	icon,
	tooltip,
	disabled,
}: TableConfirmationProps) {
	const { toast } = useToast();
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const { mutateAsync, isPending } = useMutation({
		mutationFn: onConfirm,
		onSuccess: () => setOpen(false),
		onError: ({ details }: APIError) => {
			toast({
				title: details,
				action: 'error',
			});
		},
	});
	return (
		<Popover open={open} onOpenChange={setOpen}>
			<TooltipProvider>
				<Tooltip>
					<PopoverTrigger asChild>
						<TooltipTrigger asChild>
							<Button
								rounded
								disabled={!hasPermission || disabled}
								variant='icon'
								size='sm'
								onClick={(e) => e.stopPropagation()}
							>
								{icon ?? <Trash size={16} />}
							</Button>
						</TooltipTrigger>
					</PopoverTrigger>
					<TooltipContent>{tooltip ?? t('general.delete')}</TooltipContent>
					<PopoverContent align={align} className={cn(contentClassName)}>
						<div id='popup-modal'>
							<div className='relative w-full max-w-sm max-h-full'>
								<Button
									variant='blank'
									className='absolute top-3 z-10 right-2.5 text-icon-base hover:text-icon-secondary rounded-full'
									data-modal-hide='popup-modal'
									onClick={() => setOpen(false)}
								>
									<X size={20} />
									<span className='sr-only'>Close modal</span>
								</Button>
								<div className='relative rounded p-4'>
									<div className='flex flex-col justify-center items-center space-y-4 text-center'>
										<h3 className='text-lg font-semibold text-default'>{title}</h3>
										<p className='text-sm font-normal text-subtle'>{description}</p>
									</div>
									<div className='flex items-center justify-center gap-4 mt-8'>
										<Button variant='text' size='lg' onClick={() => setOpen(false)}>
											{t('general.cancel')}
										</Button>
										<Button variant='primary' size='lg' onClick={mutateAsync} loading={isPending}>
											{t('general.ok')}
										</Button>
									</div>
								</div>
							</div>
						</div>
					</PopoverContent>
				</Tooltip>
			</TooltipProvider>
		</Popover>
	);
}
