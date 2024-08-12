import { Checkbox } from '@/components/Checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/Form';
import useNotificationStore from '@/store/notification/notificationStore';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { NotificationFilterSchema } from '../NotificationFilter';

export default function ActionFilter() {
	const [searchParams] = useSearchParams();
	const form = useFormContext<z.infer<typeof NotificationFilterSchema>>();
	const { getDistinctActions } = useNotificationStore();

	const { data: actions, refetch } = useQuery({
		queryKey: ['actions'],
		queryFn: () =>
			getDistinctActions({
				orgId: form.getValues('orgId'),
				...(form.getValues('projectId') && { projectId: form.getValues('projectId') }),
				...(form.getValues('envId') && { envId: form.getValues('envId') }),
			}),
		enabled: searchParams.has('orgId'),
	});

	useEffect(() => {
		if (form.watch('orgId')) {
			refetch();
		}
	}, [form.watch('orgId'), form.watch('envId'), form.watch('projectId')]);

	if (_.isEmpty(actions)) {
		return null;
	}

	return (
		<FormField
			control={form.control}
			name='action'
			render={() => (
				<FormItem>
					<FormLabel>Actions</FormLabel>
					{actions?.map((action: string) => (
						<FormField
							key={action}
							control={form.control}
							name='action'
							render={({ field }) => {
								return (
									<FormItem key={action} className='flex flex-row items-start space-x-3 space-y-0'>
										<FormControl>
											<Checkbox
												checked={field.value?.includes(action)}
												onCheckedChange={(checked) => {
													if (checked) {
														field.onChange([...(field.value ?? []), action]);
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
	);
}
