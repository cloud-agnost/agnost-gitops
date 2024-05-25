import { Button } from '@/components/Button';
import { DateText } from '@/components/DateText';

import useApplicationStore from '@/store/app/applicationStore.ts';
import useOrganizationStore from '@/store/organization/organizationStore';
import useVersionStore from '@/store/version/versionStore';
import { Version } from '@/types';
import { cn, getAppPermission, translate } from '@/utils';
import { GitBranch, LockSimple, LockSimpleOpen } from '@phosphor-icons/react';
import { ColumnDef } from '@tanstack/react-table';

const { selectVersion } = useVersionStore.getState();
const closeVersionDrawer = useApplicationStore.getState().closeVersionDrawer;

export const VersionTableColumns: ColumnDef<Version>[] = [
	{
		id: 'name',
		header: translate('general.name'),
		accessorKey: 'name',
		size: 75,
		cell: ({ row }) => {
			const { name, master } = row.original;
			return (
				<div className='flex items-center gap-1'>
					<GitBranch className='w-5 h-5 text-subtle mr-2 shrink-0' />
					<span className={cn(master && 'text-elements-green')}>{name}</span>
				</div>
			);
		},
	},
	{
		id: 'createdBy',
		header: translate('general.created_at'),
		accessorKey: 'createdBy',
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
		id: 'permissions',
		header: translate('version.read_write'),
		accessorKey: 'readOnly',
		size: 100,
		cell: ({ row }) => {
			const { readOnly } = row.original;
			return (
				<div className='flex items-center gap-3'>
					{readOnly ? (
						<LockSimple size={20} className='text-elements-red' />
					) : (
						<LockSimpleOpen size={20} className='text-elements-green' />
					)}
					<span className='font-sfCompact text-sm'>
						{readOnly ? translate('version.readOnly') : translate('version.read_write')}
					</span>
				</div>
			);
		},
	},
	{
		id: 'actions',
		header: '',
		size: 75,
		cell: ({ row }) => {
			const canViewVersion = getAppPermission('version.view');
			return (
				<Button
					disabled={!canViewVersion}
					size='sm'
					variant='secondary'
					onClick={() => {
						selectVersion(row.original);
						closeVersionDrawer();
					}}
				>
					{translate('general.open')}
				</Button>
			);
		},
	},
];
