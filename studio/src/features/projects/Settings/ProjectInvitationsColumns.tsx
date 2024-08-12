import { Checkbox } from '@/components/Checkbox';
import { DateText } from '@/components/DateText';
import { TableConfirmation } from '@/components/Table';
import { toast } from '@/hooks/useToast';
import useOrganizationStore from '@/store/organization/organizationStore';
import useProjectStore from '@/store/project/projectStore';
import { APIError, ColumnDefWithClassName, Invitation } from '@/types';
import { copyToClipboard, getProjectPermission, translate } from '@/utils';
import { RoleSelect } from '@/components/RoleDropdown';
import { QueryClient } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { Copy } from '@phosphor-icons/react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/Tooltip';

const queryClient = new QueryClient();

const { updateInvitationUserRole, deleteInvitation } = useProjectStore.getState();

function getPermission(type: string) {
	return getProjectPermission(`invite.${type}`);
}

function updateInvitationUserRoleHandler(token: string, role: string) {
	const orgId = useOrganizationStore.getState().organization._id;
	const projectId = useProjectStore.getState().project?._id;

	return queryClient
		.getMutationCache()
		.build(queryClient, {
			mutationFn: updateInvitationUserRole,
			onSuccess: () => {
				toast({
					title: translate('general.invitation.update', { role }),
					action: 'success',
				});
			},
			onError: (error: APIError) => {
				toast({
					title: error.details,
					action: 'error',
				});
			},
		})
		.execute({ orgId, projectId, token, role });
}
async function deleteInvitationHandler(token: string) {
	const orgId = useOrganizationStore.getState().organization._id;
	const projectId = useProjectStore.getState().project?._id;

	return queryClient
		.getMutationCache()
		.build(queryClient, {
			mutationFn: deleteInvitation,
			onSuccess: () => {
				toast({
					title: translate('general.invitation.delete'),
					action: 'success',
				});
			},
			onError: (error: APIError) => {
				toast({
					title: error.details,
					action: 'error',
				});
			},
		})
		.execute({ orgId, projectId, token });
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
		id: 'name',
		header: 'Name',
		accessorKey: 'name',
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
					type='project'
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
			const { token } = row.original;
			return (
				<div className='flex items-center justify-end'>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								onClick={() => copyToClipboard(row.original.link)}
								variant='icon'
								size='sm'
								rounded
							>
								<Copy size={14} />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Copy Invitation</TooltipContent>
					</Tooltip>
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
