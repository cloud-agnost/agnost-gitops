import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/Form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import useOrganizationStore from '@/store/organization/organizationStore';
import { useQuery } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';
import { NotificationFilterSchema } from '../NotificationFilter';

export default function OrganizationsFilter() {
	const form = useFormContext<z.infer<typeof NotificationFilterSchema>>();
	const { getAllOrganizationByUser } = useOrganizationStore();

	const { data: organizations } = useQuery({
		queryKey: ['organizations'],
		queryFn: getAllOrganizationByUser,
	});
	return (
		<div className='space-y-3'>
			<FormField
				control={form.control}
				name='orgId'
				render={({ field }) => (
					<FormItem className='flex-1'>
						<FormLabel>Organization</FormLabel>
						<FormControl>
							<Select
								key={field.value}
								value={field.value}
								onValueChange={(val) => {
									field.onChange(val);
									form.setValue('projectId', '');
									form.setValue('envId', '');
								}}
							>
								<FormControl>
									<SelectTrigger
										className='w-full rounded-l-none space-x-2'
										error={Boolean(form.formState.errors.orgId)}
									>
										<SelectValue placeholder='Select Organization' />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{organizations?.map((org) => (
										<SelectItem key={org._id} value={org._id} className='max-w-full'>
											{org.name}
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
