import { ActionsCell } from '@/components/ActionsCell';
import useOrganizationStore from '@/store/organization/organizationStore';
import useSettingsStore from '@/store/version/settingsStore';
import useVersionStore from '@/store/version/versionStore.ts';
import { APIKey, APIKeyTypes, ColumnDefWithClassName } from '@/types';
import { getVersionPermission, translate } from '@/utils';
import { Badge } from 'components/Badge';
import { BadgeColors } from 'components/Badge/Badge.tsx';
import { Checkbox } from 'components/Checkbox';
import { CopyButton } from 'components/CopyButton';
import { SortButton } from 'components/DataTable';
import { DateText } from 'components/DateText';
import { TableConfirmation } from 'components/Table';

async function onDelete(original: APIKey) {
	const { version } = useVersionStore.getState();
	const { deleteAPIKey } = useSettingsStore.getState();
	if (!version) return;
	return deleteAPIKey({
		appId: version.appId,
		orgId: version.orgId,
		keyId: original._id,
		versionId: version._id,
	});
}

function editHandler(original: APIKey) {
	const { setSelectedAPIKey, setEditAPIKeyDrawerIsOpen } = useSettingsStore.getState();
	setSelectedAPIKey(original);
	setEditAPIKeyDrawerIsOpen(true);
}

const SettingsAPIKeysColumns: ColumnDefWithClassName<APIKey>[] = [
	{
		id: 'select',
		enableResizing: false,
		size: 50,
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
		sortingFn: 'text',
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
		id: 'key',
		header: translate('general.key'),
		accessorKey: 'key',
		className: '!max-w-[420px]',
		enableSorting: true,
		cell: ({
			row: {
				original: { key },
			},
		}) => {
			return (
				<div className='flex items-center gap-2 group'>
					<div className='truncate'>{key}</div>
					<CopyButton text={key} className='hidden group-hover:block' />
				</div>
			);
		},
	},
	{
		id: 'allowRealtime',
		header: () => (
			<span className='whitespace-nowrap'>{translate('version.api_key.realtime_allowed')}</span>
		),
		accessorKey: 'allowRealtime',
		enableSorting: true,
		cell: ({
			row: {
				original: { allowRealtime },
			},
		}) => {
			return (
				<Badge
					rounded
					className='whitespace-nowrap'
					variant={allowRealtime ? 'green' : 'red'}
					text={
						allowRealtime
							? translate('version.api_key.allowed')
							: translate('version.api_key.not_allowed')
					}
				/>
			);
		},
	},
	{
		id: 'type',
		header: translate('general.type'),
		accessorKey: 'type',
		enableSorting: true,
		cell: ({
			row: {
				original: { type },
			},
		}) => {
			return <Badge className='whitespace-nowrap' variant={mapping[type]} text={type} />;
		},
	},
	{
		id: 'authorizedDomains',
		header: () => (
			<span className='whitespace-nowrap'>{translate('version.api_key.allowed_domains')}</span>
		),
		accessorKey: 'authorizedDomains',
		className: 'max-w-[300px]',
		cell: ({
			row: {
				original: { authorizedDomains, domainAuthorization },
			},
		}) => {
			const isAll = domainAuthorization === 'all';
			if (isAll) {
				return <p>{translate('version.api_key.all_domains')}</p>;
			}
			return (
				<div className='flex items-center gap-2 overflow-auto max-w-[400px] no-scrollbar'>
					{authorizedDomains.map((domain) => (
						<Badge key={domain} text={domain} variant='orange' />
					))}
				</div>
			);
		},
	},
	{
		id: 'authorizedIPs',
		header: () => (
			<span className='whitespace-nowrap'>{translate('version.api_key.allowed_ips')}</span>
		),
		accessorKey: 'authorizedIPs',
		className: 'max-w-[300px]',
		enableSorting: true,
		cell: ({
			row: {
				original: { authorizedIPs, IPAuthorization },
			},
		}) => {
			const isAll = IPAuthorization === 'all';
			if (isAll) {
				return <p>{translate('version.api_key.all_ips')}</p>;
			}
			return (
				<div className='flex items-center gap-2 overflow-auto max-w-[400px] no-scrollbar'>
					{authorizedIPs.map((ip) => (
						<Badge key={ip} text={ip} variant='blue' />
					))}
				</div>
			);
		},
	},
	{
		id: 'expiryDate',
		header: () => (
			<SortButton
				className='whitespace-nowrap'
				text={translate('general.expires_at')}
				field='expiryDate'
			/>
		),
		accessorKey: 'expiryDate',
		enableSorting: true,
		sortingFn: 'datetime',
		size: 200,
		cell: ({
			row: {
				original: { expiryDate },
			},
		}) => {
			if (!expiryDate) return;
			return <DateText date={expiryDate} />;
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
		sortingFn: 'datetime',
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
		className: 'actions',
		cell: ({ row: { original } }) => {
			const canEdit = getVersionPermission('version.key.update');
			const canDelete = getVersionPermission('version.key.delete');

			return (
				<div className='flex items-center justify-end gap-0.5'>
					<ActionsCell onEdit={editHandler} canEdit={canEdit} original={original}>
						<TableConfirmation
							align='end'
							title={translate('version.api_key.delete_modal_title')}
							description={translate('version.api_key.delete_modal_desc')}
							onConfirm={() => onDelete(original)}
							contentClassName='m-0'
							hasPermission={canDelete}
						/>
					</ActionsCell>
				</div>
			);
		},
	},
];

const mapping: Record<APIKeyTypes, BadgeColors> = {
	'full-access': 'green',
	'no-access': 'red',
	'custom-allowed': 'blue',
	'custom-excluded': 'purple',
};

export default SettingsAPIKeysColumns;
