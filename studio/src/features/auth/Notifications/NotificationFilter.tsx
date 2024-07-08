import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import EnvironmentFilter from './Filters/EnvironmentFilter';
import OrganizationsFilter from './Filters/OrganizationsFilter';
import ProjectFilter from './Filters/ProjectFilter';
import TeamMemberFilter from './Filters/TeamMemberFilter';
import ActionFilter from './Filters/ActionFilter';
import DateFilter from './Filters/DateFilter';
import { zodResolver } from '@hookform/resolvers/zod';

export const NotificationFilterSchema = z.object({
	start: z.string().optional(),
	end: z.string().optional(),
	orgId: z.string({
		required_error: 'Organization is required',
	}),
	projectId: z.string().optional(),
	envId: z.string().optional(),
	action: z.array(z.string()).optional(),
	actor: z.array(z.string()).optional(),
});

export default function NotificationFilter({
	fetchNotifications,
}: {
	fetchNotifications: () => void;
}) {
	const [_, setSearchParams] = useSearchParams();
	const form = useForm<z.infer<typeof NotificationFilterSchema>>({
		resolver: zodResolver(NotificationFilterSchema),
	});

	function clearAllFilters() {
		setSearchParams({});
		form.reset();
	}

	function onSubmit(data: z.infer<typeof NotificationFilterSchema>) {
		setSearchParams({
			orgId: data.orgId,
			...(data.projectId && { projectId: data.projectId }),
			...(data.envId && { envId: data.envId }),
			...(data.action && { a: data.action }),
			...(data.actor && { actor: data.actor }),
			...(data.start && { start: data.start }),
			...(data.end && { end: data.end }),
		});
		fetchNotifications();
	}
	return (
		<div className='p-6 bg-subtle rounded-lg space-y-6'>
			<div className='flex items-center justify-between'>
				<h1 className='text-default text-xl'>Filter</h1>
				<Button variant='blank' className='link' onClick={clearAllFilters}>
					Reset All
				</Button>
			</div>
			<div>
				<Form {...form}>
					<form className='space-y-8' onSubmit={form.handleSubmit(onSubmit)}>
						<OrganizationsFilter />
						<ProjectFilter />
						<EnvironmentFilter />
						<TeamMemberFilter />
						<ActionFilter />
						<DateFilter />
						<Button variant='primary' size='full' type='submit'>
							Apply Filters
						</Button>
					</form>
				</Form>
			</div>
		</div>
	);
}
