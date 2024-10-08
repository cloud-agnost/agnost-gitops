import { Button } from '@/components/Button';
import { INVITATIONS_SORT_OPTIONS } from '@/constants';
import { useToast } from '@/hooks';
import useAuthorizeProject from '@/hooks/useAuthorizeProject';
import useProjectStore from '@/store/project/projectStore';
import { Invitation, Project, SortOption } from '@/types';
import { FunnelSimple } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { Table } from '@tanstack/react-table';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from 'components/Dropdown';
import { RoleDropdown } from 'components/RoleDropdown';
import { SearchInput } from 'components/SearchInput';
import { SelectedRowButton } from 'components/Table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';
interface Props {
	table: Table<Invitation>;
}
function ProjectInvitationFilter({ table }: Props) {
	const { toast } = useToast();
	const { t } = useTranslation();
	const [searchParams, setSearchParams] = useSearchParams();
	const canMultiDeleteInvite = useAuthorizeProject('invite.delete');
	const { deleteMultipleInvitations, project, openInviteMemberModal } = useProjectStore();
	const { orgId } = useParams() as Record<string, string>;

	const { mutateAsync: deleteInvitations } = useMutation({
		mutationFn: () => {
			const selectedRows = table.getSelectedRowModel().rows;
			if (selectedRows) {
				return deleteMultipleInvitations({
					orgId,
					appId: project?._id as string,
					tokens: selectedRows.map((row) => row.original.token),
				});
			}
			return Promise.resolve();
		},
		onSuccess: () => {
			toast({
				title: t('general.invitation.delete') as string,
				action: 'success',
			});
			table.toggleAllRowsSelected(false);
		},
		onError: ({ details }) => {
			toast({
				title: details,
				action: 'error',
			});
		},
	});

	const selectedSort = useMemo(() => {
		return (
			INVITATIONS_SORT_OPTIONS.find((sort) => sort.value === searchParams.get('s')) ??
			INVITATIONS_SORT_OPTIONS[0]
		);
	}, [searchParams]);

	function setMemberRoleFilter(roles: string[]) {
		searchParams.set('r', roles.join(','));
		setSearchParams(searchParams);
	}

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
		<div className='flex gap-4'>
			<SearchInput className='flex-1' urlKey='e' />
			<RoleDropdown type='project' onChange={setMemberRoleFilter} />
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant='outline'>
						<FunnelSimple size={16} className='members-filter-icon mr-2' />
						{selectedSort?.name}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className='w-56'>
					{INVITATIONS_SORT_OPTIONS.map((sort) => (
						<DropdownMenuCheckboxItem
							key={sort.name}
							checked={selectedSort?.name === sort.name}
							onCheckedChange={(checked) => {
								if (checked) {
									setMemberSort(sort);
								} else {
									setMemberSort(INVITATIONS_SORT_OPTIONS[0]);
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
			{!!table.getSelectedRowModel().rows?.length && (
				<SelectedRowButton
					onDelete={deleteInvitations}
					disabled={!canMultiDeleteInvite}
					count={table.getSelectedRowModel().rows.length}
					onReset={() => table.toggleAllRowsSelected(false)}
				/>
			)}
		</div>
	);
}

export default ProjectInvitationFilter;
