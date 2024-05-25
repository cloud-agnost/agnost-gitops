import { ActionsCell } from '@/components/ActionsCell';
import { Badge } from '@/components/Badge';
import { InstanceType } from '@/components/InstanceType';
import { BADGE_COLOR_MAP } from '@/constants';
import useCacheStore from '@/store/cache/cacheStore';
import useOrganizationStore from '@/store/organization/organizationStore';
import { Cache, ColumnDefWithClassName } from '@/types';
import { getVersionPermission, translate } from '@/utils';
import { Checkbox } from 'components/Checkbox';
import { SortButton } from 'components/DataTable';
import { DateText } from 'components/DateText';

const CacheColumns: ColumnDefWithClassName<Cache>[] = [
	{
		id: 'select',
		enableResizing: false,
		className: '!max-w-[25px] !w-[25px]',
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
		header: () => <SortButton text={translate('general.name')} field='name' />,
		accessorKey: 'name',
		enableSorting: true,
		// cell: ({ row: { original } }) => {
		// 	const { name, _id } = original;
		// 	return (
		// 		<TabLink
		// 			name={name}
		// 			path={`${_id}`}
		// 			className='link'
		// 			onClick={() => {
		// 				useCacheStore.setState({ cache: original });
		// 			}}
		// 			type='Storage'
		// 		/>
		// 	);
		// },
	},
	{
		id: 'instance',
		header: () => <SortButton text={translate('general.instance')} field='instance' />,
		enableSorting: true,
		cell: ({
			row: {
				original: { iid },
			},
		}) => {
			return <InstanceType iid={iid} />;
		},
	},
	{
		id: 'assignUniqueName',
		enableSorting: true,
		header: () => (
			<SortButton text={translate('cache.assignUniqueName')} field='assignUniqueName' />
		),
		accessorKey: 'assignUniqueName',
		size: 200,
		cell: ({ row }) => {
			const { assignUniqueName } = row.original;
			const assignUniqueNameText = assignUniqueName
				? translate('general.yes')
				: translate('general.no');
			return (
				<Badge
					variant={BADGE_COLOR_MAP[assignUniqueNameText.toUpperCase()]}
					text={assignUniqueNameText}
					rounded
				/>
			);
		},
	},
	{
		id: 'created_at',
		enableSorting: true,
		header: () => (
			<SortButton
				className='whitespace-nowrap'
				text={translate('general.created_at')}
				field='createdAt'
			/>
		),
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
		id: 'updatedAt',
		enableSorting: true,
		header: () => (
			<SortButton
				className='whitespace-nowrap'
				text={translate('general.updated_at')}
				field='updatedAt'
			/>
		),
		accessorKey: 'updatedAt',

		size: 200,
		cell: ({
			row: {
				original: { updatedAt, updatedBy },
			},
		}) => {
			if (!updatedBy) return null;
			const user = useOrganizationStore
				.getState()
				.members.find((member) => member.member._id === updatedBy);
			return updatedBy && <DateText date={updatedAt} user={user} />;
		},
	},
	{
		id: 'actions',
		className: 'actions !w-[50px]',
		cell: ({ row: { original } }) => {
			const { openEditCacheModal, openDeleteCacheModal } = useCacheStore.getState();
			const canDelete = getVersionPermission('cache.delete');
			const canUpdate = getVersionPermission('cache.update');
			return (
				<ActionsCell<Cache>
					original={original}
					onEdit={() => openEditCacheModal(original)}
					onDelete={() => openDeleteCacheModal(original)}
					canDelete={canDelete}
					canEdit={canUpdate}
				/>
			);
		},
	},
];

export default CacheColumns;
