import { ActionsCell } from '@/components/ActionsCell';
import { InstanceType } from '@/components/InstanceType';
import { TabLink } from '@/features/version/Tabs';
import useOrganizationStore from '@/store/organization/organizationStore';
import useStorageStore from '@/store/storage/storageStore';
import { ColumnDefWithClassName, Storage, TabTypes } from '@/types';
import { getVersionPermission, translate } from '@/utils';
import { Checkbox } from 'components/Checkbox';
import { SortButton } from 'components/DataTable';
import { DateText } from 'components/DateText';
const { openDeleteStorageModal, openEditStorageModal } = useStorageStore.getState();

const StorageColumns: ColumnDefWithClassName<Storage>[] = [
	{
		id: 'select',
		enableResizing: false,
		className: '!max-w-[20px] !w-[20px]',
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
		cell: ({ row: { original } }) => {
			const { name, _id } = original;
			return (
				<TabLink
					name={name}
					path={`${_id}`}
					className='link'
					onClick={() => {
						useStorageStore.setState({ storage: original });
					}}
					type={TabTypes.Bucket}
				/>
			);
		},
	},
	{
		id: 'instance',
		header: translate('general.instance'),
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
		id: 'createdAt',
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
		header: () => (
			<SortButton
				className='whitespace-nowrap'
				text={translate('general.updated_at')}
				field='updatedAt'
			/>
		),
		accessorKey: 'updatedAt',
		enableSorting: true,
		sortingFn: 'datetime',
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
			const canEditBucket = getVersionPermission('storage.update');
			const canDeleteBucket = getVersionPermission('storage.delete');
			return (
				<ActionsCell<Storage>
					original={original}
					onEdit={() => openEditStorageModal(original)}
					onDelete={() => openDeleteStorageModal(original)}
					canEdit={canEditBucket}
					canDelete={canDeleteBucket}
				/>
			);
		},
	},
];

export default StorageColumns;
