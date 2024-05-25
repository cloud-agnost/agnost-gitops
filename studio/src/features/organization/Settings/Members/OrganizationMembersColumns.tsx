import { Avatar, AvatarFallback, AvatarImage } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Checkbox } from '@/components/Checkbox';
import { DateText } from '@/components/DateText';
import { RoleSelect } from '@/components/RoleDropdown';
import { TableConfirmation } from '@/components/Table';
import { toast } from '@/hooks/useToast';
import useAuthStore from '@/store/auth/authStore';
import useOrganizationStore from '@/store/organization/organizationStore';
import { OrganizationMember } from '@/types';
import { getOrgPermission, translate } from '@/utils';
import { ColumnDef } from '@tanstack/react-table';
function updateRole(userId: string, role: string) {
	useOrganizationStore.getState().changeMemberRole({
		userId,
		role,
	});
}

async function deleteHandler(member: OrganizationMember) {
	const { removeMemberFromOrganization } = useOrganizationStore.getState();
	return removeMemberFromOrganization({
		userId: member.member._id,
		onError: ({ details }) => {
			toast({
				title: details,
				action: 'error',
			});
		},
	});
}

export const OrganizationMembersColumns: ColumnDef<OrganizationMember>[] = [
	{
		id: 'select',
		enableResizing: false,
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected()}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label='Select all'
			/>
		),
		cell: ({ row }) => {
			const { member } = row.original;
			const user = useAuthStore.getState().user;
			const isDisabled = member._id === user?._id || member.isOrgOwner;
			return (
				<Checkbox
					checked={!isDisabled && row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label='Select row'
					disabled={isDisabled}
				/>
			);
		},
		meta: {
			disabled: [
				{
					key: 'member.isOrgOwner',
					value: true,
				},
				{
					key: 'member._id',
					value: useAuthStore.getState().user?._id,
				},
			],
		},
		enableSorting: false,
		enableHiding: false,
		size: 45,
	},
	{
		id: 'name',
		header: 'Members',
		accessorKey: 'name',
		size: 600,
		cell: ({ row }) => {
			const { member } = row.original;
			return (
				<div className='flex items-center  gap-4'>
					<Avatar size='md'>
						<AvatarImage src={member.pictureUrl} />
						<AvatarFallback name={member.name} color={member.color} isUserAvatar />
					</Avatar>
					<div className='flex flex-col'>
						<div className='text-default text-sm flex items-center gap-4'>
							<span className='text-default font-semibold'>{member.name}</span>
							{member.isOrgOwner && (
								<Badge variant='orange' text='Owner' className='p-0.5 text-sm' />
							)}
						</div>
						<span className='text-subtle text-xs'>{member.contactEmail}</span>
					</div>
				</div>
			);
		},
	},
	{
		id: 'joinedAt',
		header: 'Joined At',
		accessorKey: 'joinDate',
		size: 200,
		cell: ({ row }) => <DateText date={row.original.joinDate} />,
	},
	{
		id: 'role',
		header: 'Role',
		accessorKey: 'role',
		size: 200,
		cell: ({ row }) => {
			const { member } = row.original;
			const canUpdate = getOrgPermission('member.update');
			const { role } = row.original;
			const user = useAuthStore.getState().user;
			return (
				<RoleSelect
					disabled={member.isOrgOwner || !canUpdate || member._id === user?._id}
					role={role}
					type='org'
					onSelect={(newRole) => updateRole(member._id, newRole)}
				/>
			);
		},
	},
	{
		id: 'actions',
		size: 25,
		cell: ({ row: { original } }) => {
			const canDelete = getOrgPermission('member.delete');
			const isMe = original.member._id === useAuthStore.getState().user?._id;
			return (
				<TableConfirmation
					align='end'
					title={translate('organization.settings.members.delete')}
					description={translate('organization.settings.members.deleteDesc')}
					onConfirm={() => deleteHandler(original)}
					contentClassName='m-0'
					hasPermission={canDelete}
					disabled={original.member.isOrgOwner || isMe}
				/>
			);
		},
	},
];
