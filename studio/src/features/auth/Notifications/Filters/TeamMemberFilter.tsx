import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/Form';
import { BASE_URL_WITH_API } from '@/constants';
import useOrganizationStore from '@/store/organization/organizationStore';
import { FormatOptionLabelProps, OrganizationMember } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useParams, useSearchParams } from 'react-router-dom';
import Select from 'react-select';
import { NotificationFilterSchema } from '../NotificationFilter';
import { z } from 'zod';

const formatOptionLabel = ({ label, value }: FormatOptionLabelProps<OrganizationMember>) => {
	const name = label?.split(' ');
	const source = !value?.member.pictureUrl?.includes('https')
		? `${BASE_URL_WITH_API}/${value?.member.pictureUrl}`
		: value?.member.pictureUrl;

	return (
		<div className='gap-2 flex items-center'>
			{value?.member.pictureUrl ? (
				<img src={source} alt={label} className='rounded-full object-contain w-6 h-6' />
			) : (
				name && (
					<div
						className='relative inline-flex items-center justify-center cursor-pointer overflow-hidden w-6 h-6 rounded-full'
						style={{
							backgroundColor: value?.member.color,
						}}
					>
						<span className='text-default text-xs'>
							{name[0]?.charAt(0).toUpperCase()}
							{name[1]?.charAt(0).toUpperCase()}
						</span>
					</div>
				)
			)}
			<span className='ml-2 text-default text-xs'>{label}</span>
		</div>
	);
};

export default function TeamMemberFilter() {
	const form = useFormContext<z.infer<typeof NotificationFilterSchema>>();
	const [searchParams] = useSearchParams();
	const { orgId } = useParams() as Record<string, string>;
	const { getOrganizationMembers } = useOrganizationStore();
	const { data: members } = useQuery({
		queryKey: ['organizationMembers', { organizationId: orgId }],
		queryFn: () => getOrganizationMembers({ organizationId: orgId }),
		enabled: !!orgId,
	});

	const teamOptions = useMemo(() => {
		return members?.map((res) => ({
			label: res.member.name,
			value: res,
		}));
	}, [members]);

	const actorValue = useMemo(() => {
		const ids = searchParams.get('u')?.split(',') ?? [];
		return teamOptions?.filter((option) => ids.includes(option.value.member._id));
	}, [searchParams.get('u')]);

	return (
		<div className='space-y-3'>
			<FormField
				control={form.control}
				name='actor'
				render={({ field }) => (
					<FormItem className='flex-1'>
						<FormLabel>Team Members</FormLabel>
						<FormControl>
							<Select
								value={actorValue}
								formatOptionLabel={formatOptionLabel}
								isMulti
								isClearable
								isSearchable
								name='member'
								options={teamOptions}
								className='select-container'
								classNamePrefix='select'
								placeholder='Search team member'
								onChange={(value) => field.onChange(value)}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
