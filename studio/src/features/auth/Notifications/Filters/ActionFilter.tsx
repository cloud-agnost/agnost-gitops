import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/Form';
import { NOTIFICATION_ACTIONS } from '@/constants';
import { useFormContext } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { NotificationFilterSchema } from '../NotificationFilter';
import _ from 'lodash';

export default function ActionFilter() {
	const [searchParams, setSearchParams] = useSearchParams();
	const form = useFormContext<z.infer<typeof NotificationFilterSchema>>();

	function resetFilter() {
		searchParams.delete('a');
		setSearchParams(searchParams);
	}

	return (
		<div className='space-y-3'>
			<FormField
				control={form.control}
				name='action'
				render={() => (
					<FormItem>
						<div className='flex items-center justify-between'>
							<FormLabel>Action</FormLabel>
							<Button variant='blank' className='link' onClick={resetFilter}>
								Clear
							</Button>
						</div>
						{NOTIFICATION_ACTIONS.map((action) => (
							<FormField
								key={action}
								control={form.control}
								name='action'
								render={({ field }) => {
									return (
										<FormItem
											key={action}
											className='flex flex-row items-start space-x-3 space-y-0'
										>
											<FormControl>
												<Checkbox
													checked={field.value?.includes(action)}
													onCheckedChange={(checked) => {
														if (checked) {
															field.onChange([...field.value!, action]);
														} else {
															field.onChange(
																field.value?.filter((value: string) => value !== action),
															);
														}
													}}
												/>
											</FormControl>
											<FormLabel className='text-xs'>{_.startCase(action)}</FormLabel>
										</FormItem>
									);
								}}
							/>
						))}
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
