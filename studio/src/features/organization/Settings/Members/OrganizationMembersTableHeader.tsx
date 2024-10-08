import { Button } from '@/components/Button';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/components/Dropdown';
import { SearchInput } from '@/components/SearchInput';
import { INVITATIONS_SORT_OPTIONS, ORG_MEMBERS_SORT_OPTIONS } from '@/constants';
import { useToast } from '@/hooks';
import useAuthorizeOrg from '@/hooks/useAuthorizeOrg';
import useOrganizationStore from '@/store/organization/organizationStore';
import { SortOption } from '@/types';
import { FunnelSimple } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { Table } from '@tanstack/react-table';
import { RoleDropdown } from '@/components/RoleDropdown';
import { SelectedRowButton } from '@/components/Table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import '../../organization.scss';
import InviteOrganization from './InviteOrganization';

export default function OrganizationMembersTableHeader({ table }: { table: Table<any> }) {
	const { t } = useTranslation();
	const { toast } = useToast();
	const canMultipleDelete = useAuthorizeOrg('member.delete');
	const [searchParams, setSearchParams] = useSearchParams();
	const { deleteMultipleInvitations, removeMultipleMembersFromOrganization } =
		useOrganizationStore();
	const selectedTab = searchParams.get('ot') as string;
	const sortOptions: SortOption[] = useMemo(() => {
		return searchParams.get('ot') === 'members'
			? ORG_MEMBERS_SORT_OPTIONS
			: INVITATIONS_SORT_OPTIONS;
	}, [searchParams.get('ot')]);

	const selectedSort = useMemo(() => {
		return (
			sortOptions.find(
				(sort) => sort.value === searchParams.get('s') && sort.sortDir === searchParams.get('d'),
			) ?? sortOptions[0]
		);
	}, [searchParams]);

	function setMemberRoleFilter(roles: string[]) {
		if (!roles.length) {
			searchParams.delete('r');
		} else searchParams.set('r', roles.join(','));
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
	function onSuccess() {
		toast({
			title:
				selectedTab === 'member'
					? (t('organization.member_delete_success') as string)
					: (t('organization.invite_delete_success') as string),
			action: 'success',
		});
	}
	function onError({ details }: { error: string; details: string }) {
		toast({
			title: details,
			action: 'error',
		});
	}

	const { mutate: removeMemberMutate } = useMutation({
		mutationFn: removeMultipleMembersFromOrganization,
		onSuccess,
		onError,
	});
	const { mutate: removeInvitationMutate } = useMutation({
		mutationFn: deleteMultipleInvitations,
		onSuccess,
		onError,
	});
	function deleteMulti() {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedTab === 'member') {
			removeMemberMutate({
				userIds: selectedRows.map((row) => row.original.member._id) ?? [],
			});
		} else {
			removeInvitationMutate({
				tokens: selectedRows?.map((row) => row.original.token) ?? [],
			});
		}
	}
	return (
		<div className='flex items-center gap-4'>
			<SearchInput className='flex-1' urlKey='n' />
			<DropdownMenu>
				<RoleDropdown type='org' onChange={setMemberRoleFilter} />
				<DropdownMenuTrigger asChild>
					<Button variant='outline'>
						<FunnelSimple size={16} className='members-filter-icon mr-2' />
						{selectedSort?.name}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className='w-24'>
					{sortOptions.map((sort) => (
						<DropdownMenuCheckboxItem
							key={sort.name}
							checked={sort.name === selectedSort?.name}
							onCheckedChange={(checked) => {
								if (checked) {
									setMemberSort(sort);
								} else {
									setMemberSort(sortOptions[0]);
								}
							}}
						>
							{sort.name}
						</DropdownMenuCheckboxItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
			{!!table.getSelectedRowModel().rows?.length && (
				<SelectedRowButton
					count={table.getSelectedRowModel().rows.length}
					onReset={() => table.toggleAllRowsSelected(false)}
					onDelete={deleteMulti}
					disabled={!canMultipleDelete}
				/>
			)}
			<InviteOrganization />
		</div>
	);
}
