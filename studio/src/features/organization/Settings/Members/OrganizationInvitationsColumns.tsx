import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { DateText } from '@/components/DateText';
import { RoleSelect } from '@/components/RoleDropdown';
import { TableConfirmation } from '@/components/Table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/Tooltip';
import { toast } from '@/hooks/useToast';
import useOrganizationStore from '@/store/organization/organizationStore';
import { APIError, Invitation } from '@/types';
import { copyToClipboard, getOrgPermission, translate } from '@/utils';
import { Copy } from '@phosphor-icons/react';
import { QueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';

const queryClient = new QueryClient();

const { deleteInvitation } = useOrganizationStore.getState();
async function onDelete(token: string) {
	return queryClient
		.getMutationCache()
		.build(queryClient, {
			mutationFn: deleteInvitation,
			onError: (error: APIError) => {
				toast({
					title: error.details,
					action: 'error',
				});
			},
			onSuccess: () => {
				toast({
					title: 'Invitation deleted',
					action: 'success',
				});
			},
		})
		.execute({ token });
}

export const OrganizationInvitationsColumns: ColumnDef<Invitation>[] = [
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
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label='Select row'
			/>
		),
		enableSorting: false,
		enableHiding: false,
		size: 25,
	},
	{
		id: 'name',
		header: 'Name',
		accessorKey: 'name',
		size: 600,
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
			const canUpdate = getOrgPermission('invite.update');
			return (
				<RoleSelect
					role={role}
					disabled={!canUpdate}
					type='org'
					onSelect={(val) => {
						useOrganizationStore.getState?.().updateInvitationUserRole({
							token,
							role: val,
						});
					}}
				/>
			);
		},
	},
	{
		id: 'actions',
		size: 45,
		cell: ({ row }) => {
			const { token } = row.original;
			const canDelete = getOrgPermission('invite.delete');
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
						title={translate('organization.settings.members.invite.delete')}
						description={translate('organization.settings.members.invite.deleteDesc')}
						onConfirm={() => onDelete(token)}
						hasPermission={canDelete}
					/>
				</div>
			);
		},
	},
];
