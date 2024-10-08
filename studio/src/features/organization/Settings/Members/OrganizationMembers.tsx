import { DataTable } from '@/components/DataTable';
import { Loading } from '@/components/Loading';
import {
	OrganizationMembersColumns,
	OrganizationMembersTableHeader,
} from '@/features/organization';
import { useTable, useUpdateEffect } from '@/hooks';
import useOrganizationStore from '@/store/organization/organizationStore';
import { OrganizationMember } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'react-router-dom';

export default function OrganizationMembers() {
	const { members } = useOrganizationStore();
	const [searchParams] = useSearchParams();
	const { getOrganizationMembers, organization } = useOrganizationStore();
	const { orgId } = useParams() as Record<string, string>;
	const table = useTable({
		data: members,
		columns: OrganizationMembersColumns,
	});
	const { refetch, isPending } = useQuery({
		queryKey: [
			'organizationMembers',
			searchParams.get('n'),
			searchParams.get('s'),
			searchParams.get('d'),
			searchParams.get('r'),
		],
		queryFn: () =>
			getOrganizationMembers({
				organizationId: organization?._id ?? orgId,
				search: searchParams.get('n') as string,
				sortBy: searchParams.get('s') as string,
				sortDir: searchParams.get('d') as string,
				roles: searchParams.get('r')?.split(',') as string[],
			}),
		refetchOnWindowFocus: false,
	});

	useUpdateEffect(() => {
		if (searchParams.get('tab') === 'member') refetch();
	}, [searchParams, searchParams.get('tab')]);
	return (
		<div className='space-y-4 h-full'>
			<OrganizationMembersTableHeader table={table} />
			{isPending ? (
				<div className='relative h-full'>
					<Loading loading={isPending} />
				</div>
			) : (
				<DataTable<OrganizationMember> table={table} />
			)}
		</div>
	);
}
