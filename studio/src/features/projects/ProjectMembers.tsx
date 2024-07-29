import { Button } from '@/components/Button';
import { DataTable } from '@/components/DataTable';
import { Loading } from '@/components/Loading';
import { RoleDropdown } from '@/components/RoleDropdown';
import { SearchInput } from '@/components/SearchInput';
import { SelectedRowButton } from '@/components/Table';
import { useTable } from '@/hooks';
import useAuthorizeProject from '@/hooks/useAuthorizeProject';
import { toast } from '@/hooks/useToast';
import useProjectStore from '@/store/project/projectStore';
import { Project, ProjectMember } from '@/types/project';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';
import { ProjectMembersColumns } from './ProjectMembersColumns';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/components/Dropdown';
import { FunnelSimple } from '@phosphor-icons/react';
import { ORG_MEMBERS_SORT_OPTIONS } from '@/constants';
import { SortOption } from '@/types';
export default function ProjectMembers({ loading }: { loading: boolean }) {
	const { projectTeam, project, openInviteMemberModal, removeMultipleProjectMembers } =
		useProjectStore();
	const [searchParams, setSearchParams] = useSearchParams();

	const filteredAndSortedMembers = useMemo(() => {
		let members = projectTeam;

		// Filtering
		const searchQuery = searchParams.get('m');
		if (searchQuery) {
			const query = new RegExp(searchQuery, 'i');
			members = members.filter((member) => query.test(member.member.name));
		}

		// Sorting
		const sortKey = searchParams.get('s');
		const sortDir = searchParams.get('d');
		if (sortKey && sortDir && sortKey in members[0].member) {
			members = [...members].sort((a, b) => {
				if (
					a.member[sortKey as keyof ProjectMember['member']] <
					b.member[sortKey as keyof ProjectMember['member']]
				) {
					return sortDir === 'asc' ? -1 : 1;
				}
				if (
					a.member[sortKey as keyof ProjectMember['member']] >
					b.member[sortKey as keyof ProjectMember['member']]
				) {
					return sortDir === 'asc' ? 1 : -1;
				}
				return 0;
			});
		}

		return members;
	}, [searchParams.get('m'), searchParams.get('s'), searchParams.get('d'), projectTeam]);

	const table = useTable({
		data: filteredAndSortedMembers,
		columns: ProjectMembersColumns,
	});
	const canMultiDelete = useAuthorizeProject('team.delete');
	const { t } = useTranslation();
	const { orgId } = useParams() as Record<string, string>;
	const { mutate: removeMultipleMembersMutate } = useMutation({
		mutationFn: removeMultipleProjectMembers,
		onSuccess: () => {
			toast({
				title: t('general.member.delete') as string,
				action: 'success',
			});
			table?.toggleAllRowsSelected(false);
		},
		onError: ({ details }) => {
			toast({
				title: details,
				action: 'error',
			});
		},
	});
	function removeMultipleMembers() {
		const userIds = table.getSelectedRowModel().rows?.map((row) => row.original.member._id);
		removeMultipleMembersMutate({
			userIds,
			orgId,
			appId: project?._id as string,
		});
	}

	const selectedSort = useMemo(() => {
		return (
			ORG_MEMBERS_SORT_OPTIONS.find(
				(sort) => sort.value === searchParams.get('s') && sort.sortDir === searchParams.get('d'),
			) ?? ORG_MEMBERS_SORT_OPTIONS[0]
		);
	}, [searchParams]);

	function setMemberSort(sort: SortOption) {
		if (sort.sortDir && sort.value) {
			searchParams.set('s', sort.value);
			searchParams.set('d', sort.sortDir);
		} else {
			searchParams.delete('s');
			searchParams.delete('d');
		}
		setSearchParams(searchParams);
	}
	return (
		<div className='space-y-6 p-6 relative'>
			<div className='flex items-center gap-4'>
				<SearchInput
					className='flex-1'
					placeholder={t('general.search') as string}
					urlKey='m'
					value={searchParams.get('m') as string}
				/>
				<div className='flex items-center gap-4'>
					{!!table.getSelectedRowModel().rows?.length && (
						<SelectedRowButton
							onDelete={removeMultipleMembers}
							count={table.getSelectedRowModel().rows.length}
							onReset={() => table.toggleAllRowsSelected(false)}
							disabled={!canMultiDelete}
						/>
					)}
					<RoleDropdown
						type='project'
						onChange={(roles) => table?.getColumn('role')?.setFilterValue(roles)}
					/>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant='outline'>
								<FunnelSimple size={16} className='members-filter-icon mr-2' />
								{selectedSort?.name}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className='w-24'>
							{ORG_MEMBERS_SORT_OPTIONS.map((sort) => (
								<DropdownMenuCheckboxItem
									key={sort.name}
									checked={sort.name === selectedSort?.name}
									onCheckedChange={(checked) => {
										if (checked) {
											setMemberSort(sort);
										} else {
											setMemberSort(ORG_MEMBERS_SORT_OPTIONS[0]);
										}
									}}
								>
									{sort.name}
								</DropdownMenuCheckboxItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>

					<Button variant='primary' onClick={() => openInviteMemberModal(project as Project)}>
						{t('general.addMembers')}
					</Button>
				</div>
			</div>
			{loading ? <Loading loading={loading} /> : <DataTable<ProjectMember> table={table} />}
		</div>
	);
}
