import { Checkbox } from '@/components/Checkbox';
import { DateText } from '@/components/DateText';
import { ResendButton } from '@/components/ResendButton';
import { TableConfirmation } from '@/components/Table';
import { toast } from '@/hooks/useToast';
import useOrganizationStore from '@/store/organization/organizationStore';
import useProjectStore from '@/store/project/projectStore';
import { ColumnDefWithClassName, Invitation } from '@/types';
import { getProjectPermission, translate } from '@/utils';
import { RoleSelect } from 'components/RoleDropdown';

const { updateInvitationUserRole, resendInvitation, deleteInvitation } = useProjectStore.getState();

function getPermission(type: string) {
	return getProjectPermission(`invite.${type}`);
}
function updateInvitationUserRoleHandler(token: string, role: string) {
	const orgId = useOrganizationStore.getState().organization._id;
	const projectId = useProjectStore.getState().project?._id as string;
	updateInvitationUserRole({
		orgId,
		projectId,
		token,
		role,
		onSuccess: () => {
			toast({
				title: translate('general.invitation.update', { role }) as string,
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
function resendInvitationHandler(token: string, email: string) {
	const orgId = useOrganizationStore.getState().organization._id;
	const projectId = useProjectStore.getState().project?._id as string;
	resendInvitation({
		token,
		projectId,
		orgId,
		onSuccess: () => {
			toast({
				title: translate('general.invitation.resent_success', {
					email,
				}),
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

async function deleteInvitationHandler(token: string) {
	const orgId = useOrganizationStore.getState().organization._id;
	const projectId = useProjectStore.getState().project?._id as string;
	return deleteInvitation({
		token,
		projectId,
		orgId,
		onSuccess: () => {
			toast({
				title: translate('general.invitation.delete'),
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
export const ProjectInvitationsColumns: ColumnDefWithClassName<Invitation>[] = [
	{
		id: 'select',
		enableResizing: false,
		className: '!max-w-[40px] !w-[40px]',
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected()}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label='Select all'
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label='Select row'
			/>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		id: 'email',
		header: 'Email',
		accessorKey: 'email',
	},
	{
		id: 'invitedAt',
		header: 'Invited At',
		accessorKey: 'createdAt',
		size: 200,
		cell: ({ row }) => <DateText date={row.original.createdAt} />,
	},
	{
		id: 'role',
		header: 'Role',
		accessorKey: 'role',
		size: 200,
		cell: ({ row }) => {
			const { token, role } = row.original;

			return (
				<RoleSelect
					role={role}
					type={'app'}
					onSelect={(newRole) => updateInvitationUserRoleHandler(token, newRole)}
					disabled={!getPermission('update')}
				/>
			);
		},
	},
	{
		id: 'actions',
		className: 'actions',
		size: 20,
		cell: ({ row }) => {
			const { token, email } = row.original;
			return (
				<div className='flex items-center justify-end'>
					<ResendButton
						disabled={!getPermission('update')}
						onResend={() => resendInvitationHandler(token, email)}
					/>
					<TableConfirmation
						title={translate('project.invite.delete')}
						description={translate('project.invite.deleteDesc')}
						onConfirm={() => deleteInvitationHandler(token)}
						hasPermission={getPermission('delete')}
					/>
				</div>
			);
		},
	},
];
