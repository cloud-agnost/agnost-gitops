import { Checkbox } from '@/components/Checkbox';
import { SortButton } from '@/components/DataTable';
import { DateText } from '@/components/DateText';
import { TableConfirmation } from '@/components/Table';
import { toast } from '@/hooks/useToast';
import useOrganizationStore from '@/store/organization/organizationStore';
import useSettingsStore from '@/store/version/settingsStore';
import { APIError, ColumnDefWithClassName, CustomDomain } from '@/types';
import { getVersionPermission, translate } from '@/utils';
import { QueryClient } from '@tanstack/react-query';
const { deleteCustomDomain } = useSettingsStore.getState();
const queryClient = new QueryClient();
async function deleteHandler(domain: CustomDomain) {
	return queryClient
		.getMutationCache()
		.build(queryClient, {
			mutationFn: deleteCustomDomain,
			onError: (error: APIError) => {
				toast({
					title: error.details,
					action: 'error',
				});
			},
		})
		.execute({
			appId: domain.appId,
			orgId: domain.orgId,
			versionId: domain.versionId,
			domainId: domain._id,
		});
}

export const VersionDomainColumns: ColumnDefWithClassName<CustomDomain>[] = [
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
		size: 40,
	},
	{
		id: 'name',
		header: () => <SortButton text={translate('cluster.domain.title')} field='domain' />,
		accessorKey: 'domain',
		size: 200,
	},
	{
		id: 'createdAt',
		header: () => <SortButton text={translate('general.created_at')} field='createdAt' />,
		accessorKey: 'createdAt',
		size: 200,
		cell: ({ row }) => {
			const { createdAt, createdBy } = row.original;
			const user = useOrganizationStore
				.getState()
				.members.find((member) => member.member._id === createdBy);

			return <DateText date={createdAt} user={user} />;
		},
	},
	{
		id: 'actions',
		className: 'actions !w-[50px]',
		cell: ({ row: { original } }) => {
			const canDelete = getVersionPermission('domain.delete');
			return (
				<TableConfirmation
					align='end'
					title={translate('cluster.domain.delete')}
					description={translate('cluster.domain.delete_description')}
					onConfirm={() => deleteHandler(original)}
					contentClassName='m-0'
					hasPermission={canDelete}
				/>
			);
		},
	},
];
