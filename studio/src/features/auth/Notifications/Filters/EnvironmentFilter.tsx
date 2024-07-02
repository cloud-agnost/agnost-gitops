import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/Form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import useEnvironmentStore from '@/store/environment/environmentStore';
import { useQuery } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';
import { NotificationFilterSchema } from '../NotificationFilter';
import { z } from 'zod';
import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
export default function EnvironmentFilter() {
	const { getEnvironments } = useEnvironmentStore();
	const form = useFormContext<z.infer<typeof NotificationFilterSchema>>();
	const { data: environments, refetch } = useQuery({
		queryKey: ['environments'],
		queryFn: () =>
			getEnvironments({
				orgId: form.watch('orgId'),
				projectId: form.watch('projectId')!,
				page: 0,
				size: 250,
			}),
		enabled: !!form.watch('orgId') && !!form.watch('projectId'),
	});

	useEffect(() => {
		refetch();
	}, [form.watch('orgId'), form.watch('projectId')]);
	return (
		<div className='space-y-3'>
			<FormField
				control={form.control}
				name='envId'
				disabled={!form.watch('orgId') || !form.watch('projectId')}
				render={({ field }) => (
					<FormItem className='flex-1'>
						<FormLabel>Environment</FormLabel>
						<FormControl>
							<Select
								value={field.value}
								onValueChange={field.onChange}
								disabled={!form.watch('orgId') || !form.watch('projectId')}
							>
								<FormControl>
									<SelectTrigger
										className='w-full rounded-l-none space-x-2'
										error={Boolean(form.formState.errors.envId)}
									>
										<SelectValue placeholder='Select environment' />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{environments?.map((env) => (
										<SelectItem key={env._id} value={env._id} className='max-w-full'>
											{env.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
