import { Button } from '@/components/Button';
import { cn } from '@/utils';
import { CalendarBlank, X } from '@phosphor-icons/react';
import { Calendar } from 'components/Calendar';
import { CalendarProps } from 'components/Calendar/Calendar.tsx';
import { Popover, PopoverContent, PopoverTrigger } from 'components/Popover';
import { format } from 'date-fns';
import { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

export type DatePickerProps = CalendarProps & {
	className?: string;
	error?: boolean;
	clearable?: boolean;
};
export default function DatePicker({ className, error, clearable, ...props }: DatePickerProps) {
	const { t } = useTranslation();
	const formatted = (
		<span className={cn('text-subtle text-sm', props.selected && 'text-default')}>
			{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
			{/*@ts-ignore*/}
			{props.selected ? format(props.selected, 'PPP') : t('forms.pick_a_date')}
		</span>
	);

	function clear(e: MouseEvent) {
		e.stopPropagation();
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		props.onSelect?.(undefined);
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant='outline'
					className={cn(
						'w-full px-3 relative justify-start text-left font-normal bg-input-background disabled:cursor-not-allowed disabled:opacity-50',
						!props.selected && 'text-muted-foreground',
					)}
					onClick={(e) => e.stopPropagation()}
					size='sm'
				>
					<CalendarBlank
						className={cn('mr-2 h-4 w-4', !props.selected ? 'text-subtle' : 'text-default')}
					/>
					{formatted}
					{clearable && props.selected && (
						<span
							role='button'
							className='absolute h-full right-0 px-2 text-subtle hover:text-default flex items-center justify-center'
						>
							<X onClick={clear} />
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className={cn('w-auto p-0', error && 'error', className)}>
				<Calendar {...props} />
			</PopoverContent>
		</Popover>
	);
}
