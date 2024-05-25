import { ActionsCell } from '@/components/ActionsCell';
import { Badge } from '@/components/Badge';
import { SortButton } from '@/components/DataTable';
import { BADGE_COLOR_MAP } from '@/constants';
import useResourceStore from '@/store/resources/resourceStore';
import { ColumnDefWithClassName, Resource } from '@/types';
import { getOrgPermission, translate } from '@/utils';

const canEditResource = getOrgPermission('resource.update');
const canDeleteResource = getOrgPermission('resource.delete');
export const EnvironmentResourcesColumn: ColumnDefWithClassName<Resource>[] = [
	{
		id: 'name',
		header: () => {
			return <SortButton text={translate('resources.table.name')} field='name' />;
		},
		accessorKey: 'name',
		size: 200,
	},
	{
		id: 'type',
		header: () => {
			return <SortButton text={translate('resources.table.type')} field='instance' />;
		},
		accessorKey: 'instance',
		size: 200,
	},
	{
		id: 'status',
		header: () => {
			return <SortButton text={translate('resources.table.status')} field='status' />;
		},
		accessorKey: 'status',
		size: 200,
		cell: ({ row }) => {
			const { status } = row.original;
			return <Badge text={status} variant={BADGE_COLOR_MAP[status.toUpperCase()]} rounded />;
		},
	},
	{
		id: 'managed',
		header: () => {
			return <SortButton text={translate('resources.table.managed')} field='managed' />;
		},
		accessorKey: 'managed',
		size: 200,
		cell: ({ row }) => {
			const { managed } = row.original;
			const text = managed ? 'Yes' : 'No';
			return <Badge text={text} variant={BADGE_COLOR_MAP[text.toUpperCase()]} rounded />;
		},
	},
	{
		id: 'actions',
		header: translate('resources.table.actions'),
		className: 'actions',
		size: 45,
		cell: ({ row }) => {
			return (
				<ActionsCell
					original={row.original}
					onDelete={() => () =>
						useResourceStore.setState({
							deletedResource: row.original,
							isDeletedResourceModalOpen: true,
						})
					}
					canEdit={canEditResource}
					canDelete={canDeleteResource}
				/>
			);
		},
	},
];
