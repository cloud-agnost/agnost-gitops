import { ActionsCell } from '@/components/ActionsCell';
import { CopyButton } from '@/components/CopyButton';
import useOrganizationStore from '@/store/organization/organizationStore';
import useSettingsStore from '@/store/version/settingsStore';
import useVersionStore from '@/store/version/versionStore.ts';
import { ColumnDefWithClassName, Param } from '@/types';
import { getVersionPermission, translate } from '@/utils';
import { Checkbox } from 'components/Checkbox';
import { SortButton } from 'components/DataTable';
import { DateText } from 'components/DateText';
import { TableConfirmation } from 'components/Table';

const { deleteParam, setParam, setEditParamDrawerIsOpen } = useSettingsStore.getState();
async function onDelete(paramId: string) {
	const { version } = useVersionStore.getState();
	if (!version) return;
	return deleteParam({
		versionId: version?._id,
		orgId: version?.orgId,
		appId: version?.appId,
		paramId,
	});
}

function editHandler(original: Param) {
	setParam(original);
	setEditParamDrawerIsOpen(true);
}

const VariableColumns: ColumnDefWithClassName<Param>[] = [
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
		header: () => <SortButton text={translate('general.name')} field='name' />,
		accessorKey: 'name',
		sortingFn: 'text',
		enableSorting: true,
		size: 300,
		cell: ({
			row: {
				original: { name },
			},
		}) => {
			return (
				<div className='flex items-center gap-4 group'>
					<div className='truncate'>{name}</div>
					<CopyButton text={name} className='hidden group-hover:block' />
				</div>
			);
		},
	},
	{
		id: 'value',
		header: () => <SortButton text={translate('general.value')} field='value' />,
		accessorKey: 'value',
		sortingFn: 'text',
		enableSorting: true,
		size: 300,
		cell: ({
			row: {
				original: { value },
			},
		}) => {
			return <div className='truncate'>{value}</div>;
		},
	},
	{
		id: 'created_at',
		header: () => <SortButton text={translate('general.created_at')} field='createdAt' />,
		enableSorting: true,
		sortingFn: 'datetime',
		accessorKey: 'createdAt',
		size: 100,
		cell: ({ row }) => {
			const { createdAt, createdBy } = row.original;
			const user = useOrganizationStore
				.getState()
				.members.find((member) => member.member._id === createdBy);

			return <DateText date={createdAt} user={user} />;
		},
	},

	{
		id: 'updated_at',
		header: () => <SortButton text={translate('general.updated_at')} field='updatedAt' />,
		accessorKey: 'updatedAt',
		enableSorting: true,
		sortingFn: 'datetime',
		size: 100,
		cell: ({ row }) => {
			const { updatedAt, updatedBy } = row.original;
			const user = useOrganizationStore
				.getState()
				.members.find((member) => member.member._id === updatedBy);
			return updatedBy && <DateText date={updatedAt} user={user} />;
		},
	},
	{
		id: 'actions',
		className: 'actions',
		size: 100,
		cell: ({ row: { original } }) => {
			const canEditParam = getVersionPermission('version.param.update');
			const canDeleteParam = getVersionPermission('version.param.delete');
			return (
				<ActionsCell original={original} onEdit={editHandler} canEdit={canEditParam}>
					<TableConfirmation
						align='end'
						title={translate('version.variable.delete_modal_title')}
						description={translate('version.variable.delete_modal_desc')}
						onConfirm={() => onDelete(original._id)}
						contentClassName='m-0'
						hasPermission={canDeleteParam}
					/>
				</ActionsCell>
			);
		},
	},
];

export default VariableColumns;
