import { Button } from '@/components/Button';
import { DateText } from '@/components/DateText';

import useOrganizationStore from '@/store/organization/organizationStore';
import useProjectEnvironmentStore from '@/store/project/projectEnvironmentStore';
import useProjectStore from '@/store/project/projectStore';
import { ProjectEnvironment } from '@/types';
import { getProjectPermission, translate } from '@/utils';
import { GitBranch, LockSimple, LockSimpleOpen } from '@phosphor-icons/react';
import { ColumnDef } from '@tanstack/react-table';

const { selectEnvironment } = useProjectEnvironmentStore.getState();
const closeVersionDrawer = useProjectStore.getState().closeEnvironmentDrawer;

export const ProjectEnvironmentsColumns: ColumnDef<ProjectEnvironment>[] = [
	{
		id: 'name',
		header: translate('general.name'),
		accessorKey: 'name',
		size: 75,
		cell: ({ row }) => {
			const { name } = row.original;
			return (
				<div className='flex items-center gap-1'>
					<GitBranch className='w-5 h-5 text-subtle mr-2 shrink-0' />
					<span>{name}</span>
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
			const canViewVersion = getProjectPermission('environment.view');
			return (
				<Button
					disabled={!canViewVersion}
					size='sm'
					variant='secondary'
					onClick={() => {
						selectEnvironment(row.original);
						closeVersionDrawer();
					}}
				>
					{translate('general.open')}
				</Button>
			);
		},
	},
];
