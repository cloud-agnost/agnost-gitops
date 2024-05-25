import { Avatar, AvatarFallback, AvatarImage } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Checkbox } from '@/components/Checkbox';
import { SortButton } from '@/components/DataTable';
import { TableConfirmation } from '@/components/Table';
import { toast } from '@/hooks/useToast';
import useAuthStore from '@/store/auth/authStore';
import useOrganizationStore from '@/store/organization/organizationStore';
import useProjectStore from '@/store/project/projectStore';
import { ProjectMember } from '@/types/project';
import { getProjectPermission, translate } from '@/utils';
import { ColumnDef } from '@tanstack/react-table';
import { RoleSelect } from 'components/RoleDropdown';

async function removeMember(userId: string, projectId: string) {
	const orgId = useOrganizationStore.getState().organization._id;

	return useProjectStore.getState?.().removeProjectMember({
		userId,
		orgId,
		projectId,
		onSuccess: () => {
			toast({
				title: translate('general.member.delete'),
				action: 'success',
			});
		},
		onError: ({ details }) => {
			toast({
				title: details,
				action: 'error',
			});
		},
	});
}
function updateMemberRole(userId: string, role: string, projectId: string) {
	const orgId = useOrganizationStore.getState().organization._id;
	useProjectStore.getState?.().changeProjectTeamRole({
		userId,
		role,
		projectId,
		orgId,
		onError: ({ details }) => {
			toast({
				title: details,
				action: 'error',
			});
		},
	});
}
export const ProjectMembersColumns: ColumnDef<ProjectMember>[] = [
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
			const isDisabled = member._id === user?._id || member.isProjectOwner;
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
		header: () => <SortButton text={translate('application.table.name')} field='name' />,
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
							{member.isProjectOwner && (
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
		id: 'role',
		header: 'Role',
		accessorKey: 'role',
		size: 200,
		filterFn: 'arrIncludesSome',
		cell: ({ row }) => {
			const { role, member, projectId } = row.original;
			const canUpdate = getProjectPermission('team.update');
			const user = useAuthStore.getState().user;
			const isMe = member._id === user?._id;
			return (
				<RoleSelect
					role={role}
					type={'project'}
					onSelect={(selectedRole) => updateMemberRole(member._id, selectedRole, projectId)}
					disabled={member.isProjectOwner || !canUpdate || isMe}
				/>
			);
		},
	},
	{
		id: 'action',
		header: '',
		size: 100,
		cell: ({ row }) => {
			const { member, projectId } = row.original;
			const canDelete = getProjectPermission('team.delete');
			const user = useAuthStore.getState().user;
			const isMe = member._id === user?._id;
			return (
				!member.isProjectOwner && (
					<TableConfirmation
						title={translate('application.deleteMember.title')}
						description={translate('application.deleteMember.description')}
						onConfirm={() => removeMember(member._id, projectId)}
						hasPermission={canDelete}
						disabled={isMe}
					/>
				)
			);
		},
	},
];
