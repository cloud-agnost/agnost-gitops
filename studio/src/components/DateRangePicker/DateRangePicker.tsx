import { Button } from '@/components/Button';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/components/Popover';
import { DATE_FORMAT, cn, formatDate } from '@/utils';
import { CalendarBlank } from '@phosphor-icons/react';
import { useState } from 'react';
import { DateRangePicker as DateRange, Range, RangeKeyDict } from 'react-date-range';

import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

interface DateRangePickerProps {
	date?: Range[];
	onChange?: (range: Range[]) => void;
}
export function DateRangePicker({ date, onChange }: DateRangePickerProps) {
	const [range, setRange] = useState<Range[]>(date || []);

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant={'outline'}
					className={cn(
						'w-[240px] justify-start text-left font-normal',
						!date && 'text-muted-foreground',
					)}
				>
					<CalendarBlank size={16} className='mr-2' />
					{date ? (
						<span>
							{formatDate(date[0].startDate as Date, DATE_FORMAT)} -{' '}
							{formatDate(date[0].endDate as Date, DATE_FORMAT)}
						</span>
					) : (
						<span>Pick a date</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent align='start' className='flex w-auto flex-col space-y-2 mt-2 mr-5'>
				<DateRange
					onChange={(item: RangeKeyDict) => setRange([item.selection])}
					moveRangeOnFirstSelection={false}
					months={1}
					ranges={range}
					direction='horizontal'
				/>

				<div className='flex items-center justify-end gap-2 border-t border-border p-4'>
					<PopoverClose asChild>
						<Button
							variant='secondary'
							className='mr-2'
							size='lg'
							onClick={() => setRange(date || [])}
						>
							Cancel
						</Button>
					</PopoverClose>
					<PopoverClose asChild>
						<Button size='lg' onClick={() => onChange?.(range)}>
							Apply
						</Button>
					</PopoverClose>
				</div>
			</PopoverContent>
		</Popover>
	);
}
