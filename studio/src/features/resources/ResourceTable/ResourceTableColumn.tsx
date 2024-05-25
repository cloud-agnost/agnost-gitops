import { ActionsCell } from '@/components/ActionsCell';
import { Badge } from '@/components/Badge';
import { SortButton } from '@/components/DataTable';
import { DateText } from '@/components/DateText';
import { BADGE_COLOR_MAP, RESOURCE_ICON_MAP } from '@/constants';
import useOrganizationStore from '@/store/organization/organizationStore';
import useResourceStore from '@/store/resources/resourceStore';
import { ColumnDefWithClassName, Resource, ResourceCreateType } from '@/types';
import { getOrgPermission, translate } from '@/utils';
import { t } from 'i18next';

const { openEditResourceModal } = useResourceStore.getState();

export const ResourceTableColumn: ColumnDefWithClassName<Resource>[] = [
	{
		id: 'name',
		header: () => {
			return <SortButton text={translate('resources.table.name')} field='name' />;
		},
		accessorKey: 'name',
		size: 200,
		enableSorting: true,
	},
	{
		id: 'type',
		header: () => {
			return <SortButton text={translate('resources.table.type')} field='instance' />;
		},
		accessorKey: 'instance',
		size: 200,
		enableSorting: true,

		cell: ({ row }) => {
			const { instance } = row.original;
			const Icon = RESOURCE_ICON_MAP[instance];
			return (
				<div className='flex gap-1 items-center'>
					{Icon && <Icon className='w-6 h-6' />}
					<span>{instance}</span>
				</div>
			);
		},
	},
	{
		id: 'status',
		header: () => {
			return <SortButton text={translate('resources.table.status')} field='status' />;
		},
		accessorKey: 'status',
		size: 200,
		enableSorting: true,
		cell: ({ row }) => {
			const { status } = row.original;
			return <Badge text={status} variant={BADGE_COLOR_MAP[status?.toUpperCase()]} rounded />;
		},
	},
	{
		id: 'manage',
		header: () => {
			return <SortButton text={translate('resources.table.managed')} field='manage' />;
		},
		accessorKey: 'manage',
		size: 200,
		enableSorting: true,
		cell: ({ row }) => {
			const { managed } = row.original;
			const status = managed ? t('general.yes') : t('general.no');
			return <Badge text={status} variant={BADGE_COLOR_MAP[status.toUpperCase()]} rounded />;
		},
	},
	{
		id: 'tcpProxyEnabled',
		header: () => {
			return (
				<SortButton text={translate('resources.table.tcpProxyEnabled')} field='tcpProxyEnabled' />
			);
		},
		accessorKey: 'tcpProxyEnabled',
		size: 200,
		enableSorting: true,
		cell: ({ row }) => {
			const { tcpProxyEnabled } = row.original;
			const status = tcpProxyEnabled ? t('general.yes') : t('general.no');
			return <Badge text={status} variant={BADGE_COLOR_MAP[status.toUpperCase()]} rounded />;
		},
	},
	{
		id: 'allowedRoles',
		header: () => {
			return <SortButton text={translate('resources.table.allowedRoles')} field='allowedRoles' />;
		},
		accessorKey: 'allowedRoles',
		size: 200,
		enableSorting: true,
		cell: ({ row }) => {
			const { allowedRoles } = row.original;
			return (
				<div className='flex gap-2'>
					{allowedRoles.sort().map((role) => {
						return <Badge key={role} text={role} variant={BADGE_COLOR_MAP[role.toUpperCase()]} />;
					})}
				</div>
			);
		},
	},
	{
		id: 'createdAt',
		enableSorting: true,
		header: () => {
			return <SortButton text={translate('resources.table.createdAt')} field='createdAt' />;
		},
		accessorKey: 'createdAt',
		size: 200,
		cell: ({
			row: {
				original: { createdAt, createdBy },
			},
		}) => {
			const user = useOrganizationStore
				.getState()
				.members.find((member) => member.member._id === createdBy);

			return <DateText date={createdAt} user={user} />;
		},
	},
	{
		id: 'actions',
		header: translate('resources.table.actions'),
		size: 45,
		className: 'actions',
		cell: ({ row }) => {
			const resourceCreateType =
				'config' in row.original ? ResourceCreateType.New : ResourceCreateType.Existing;
			const canEditResource = getOrgPermission('resource.update');
			const canDeleteResource = getOrgPermission('resource.delete');
			return (
				row.original.deletable && (
					<ActionsCell
						original={row.original}
						onDelete={() =>
							useResourceStore.setState({
								deletedResource: row.original,
								isDeletedResourceModalOpen: true,
							})
						}
						onEdit={() => openEditResourceModal(row.original, resourceCreateType)}
						canEdit={canEditResource}
						canDelete={canDeleteResource}
					/>
				)
			);
		},
	},
];
