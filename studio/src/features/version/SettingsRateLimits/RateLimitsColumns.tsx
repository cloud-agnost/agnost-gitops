import { ActionsCell } from '@/components/ActionsCell';
import useOrganizationStore from '@/store/organization/organizationStore';
import useSettingsStore from '@/store/version/settingsStore';
import useVersionStore from '@/store/version/versionStore.ts';
import { ColumnDefWithClassName, RateLimit } from '@/types';
import { getVersionPermission, translate } from '@/utils';
import { Checkbox } from 'components/Checkbox';
import { SortButton } from 'components/DataTable';
import { DateText } from 'components/DateText';
import { TableConfirmation } from 'components/Table';

const { version } = useVersionStore.getState();
const { setEditRateLimitDrawerIsOpen, setRateLimit, deleteRateLimit } = useSettingsStore.getState();
async function onDelete(limitId: string) {
	if (!version) return;
	return deleteRateLimit({
		appId: version.appId,
		versionId: version._id,
		orgId: version.orgId,
		limitId,
	});
}
function editHandler(original: RateLimit) {
	setRateLimit(original);
	setEditRateLimitDrawerIsOpen(true);
}
const RateLimitsColumns: ColumnDefWithClassName<RateLimit>[] = [
	{
		id: 'select',
		enableResizing: false,
		className:
			'!max-w-[40px] !w-[40px] [&_.checkbox-wrapper]:mx-auto [&_.checkbox-wrapper]:w-fit !p-0',
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
		sortingFn: 'text',
		enableSorting: true,
		cell: ({
			row: {
				original: { name },
			},
		}) => {
			return <div className='truncate'>{name}</div>;
		},
		size: 100,
	},
	{
		id: 'limit',
		header: translate('general.limit'),
		accessorKey: 'limit',
		sortingFn: 'textCaseSensitive',
		enableSorting: true,
		cell: ({
			row: {
				original: { duration, rate },
			},
		}) => {
			return (
				<div className='whitespace-nowrap'>
					{translate('version.limiter_detail', {
						rate: rate,
						duration: duration,
					})}
				</div>
			);
		},
	},
	{
		id: 'created_at',
		header: () => <SortButton text={translate('general.created_at')} field='createdAt' />,
		enableSorting: true,
		sortingFn: 'datetime',
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
		id: 'updated_at',
		header: () => <SortButton text={translate('general.updated_at')} field='updatedAt' />,
		accessorKey: 'updatedAt',
		enableSorting: true,
		size: 200,
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
		className: 'actions !w-[50px]',
		cell: ({ row: { original } }) => {
			const canEditRateLimit = getVersionPermission('version.limit.update');
			const canDeleteRateLimit = getVersionPermission('version.limit.delete');

			return (
				<ActionsCell original={original} onEdit={editHandler} canEdit={canEditRateLimit}>
					<TableConfirmation
						align='end'
						title={translate('version.npm.delete_modal_title')}
						description={translate('version.npm.delete_modal_desc')}
						onConfirm={() => onDelete(original._id)}
						contentClassName='m-0'
						hasPermission={canDeleteRateLimit}
					/>
				</ActionsCell>
			);
		},
	},
];

export default RateLimitsColumns;
