import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/Form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import useProjectStore from '@/store/project/projectStore';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';
import { NotificationFilterSchema } from '../NotificationFilter';

export default function ProjectFilter() {
	const form = useFormContext<z.infer<typeof NotificationFilterSchema>>();
	const { getProjects } = useProjectStore();

	const { data: projects, refetch } = useQuery({
		queryKey: ['projects'],
		queryFn: () => getProjects(form.watch('orgId')),
		enabled: !!form.watch('orgId'),
	});

	useEffect(() => {
		if (form.watch('orgId')) refetch();
	}, [form.watch('orgId')]);

	return (
		<FormField
			control={form.control}
			name='projectId'
			disabled={!form.watch('orgId')}
			render={({ field }) => (
				<FormItem className='flex-1'>
					<FormLabel>Projects</FormLabel>
					<FormControl>
						<Select
							value={field.value}
							onValueChange={(val) => {
								field.onChange(val);
								form.setValue('envId', '');
							}}
							disabled={!form.watch('orgId')}
						>
							<FormControl>
								<SelectTrigger
									className='w-full rounded-l-none space-x-2'
									error={Boolean(form.formState.errors.projectId)}
								>
									<SelectValue placeholder='Select project' />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{projects?.map((project) => (
									<SelectItem key={project._id} value={project._id} className='max-w-full'>
										{project.name}
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
