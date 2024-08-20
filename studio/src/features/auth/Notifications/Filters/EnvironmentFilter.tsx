import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/Form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import useEnvironmentStore from '@/store/environment/environmentStore';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';
import { NotificationFilterSchema } from '../NotificationFilter';
export default function EnvironmentFilter() {
	const { getEnvironments } = useEnvironmentStore();
	const form = useFormContext<z.infer<typeof NotificationFilterSchema>>();
	const { data: environments, refetch } = useQuery({
		queryKey: ['environments'],
		queryFn: () =>
			getEnvironments({
				orgId: form.watch('orgId'),
				projectId: form.watch('projectId')!,
			}),
		enabled: !!form.watch('orgId') && !!form.watch('projectId'),
	});

	useEffect(() => {
		if (form.watch('orgId') && form.watch('projectId')) refetch();
	}, [form.watch('orgId'), form.watch('projectId')]);
	return (
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
	);
}
