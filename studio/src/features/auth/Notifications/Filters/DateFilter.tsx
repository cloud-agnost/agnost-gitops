import { DateRangePicker } from '@/components/DateRangePicker';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/Form';
import { endOfDay, startOfDay } from 'date-fns';
import { useEffect, useState } from 'react';
import { Range } from 'react-date-range';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';
import { NotificationFilterSchema } from '../NotificationFilter';

export default function DateFilter() {
	const form = useFormContext<z.infer<typeof NotificationFilterSchema>>();

	const [date, setDate] = useState<Range[]>([
		{
			startDate: startOfDay(new Date()),
			endDate: endOfDay(new Date()),
			key: 'selection',
		},
	]);

	useEffect(() => {
		form.setValue('start', date[0].startDate?.toISOString());
		form.setValue('end', date[0].endDate?.toISOString());
	}, []);

	return (
		<FormField
			control={form.control}
			name='start'
			render={() => (
				<FormItem>
					<div className='flex items-center justify-between w-full'>
						<FormLabel>Date Time & Range</FormLabel>
					</div>
					<DateRangePicker
						key={date[0].startDate?.toISOString()}
						date={date}
						onChange={(date) => {
							setDate(date);
							form.setValue('start', startOfDay(date[0].startDate!).toISOString());
							form.setValue('end', endOfDay(date[0].endDate!).toISOString());
						}}
					/>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
