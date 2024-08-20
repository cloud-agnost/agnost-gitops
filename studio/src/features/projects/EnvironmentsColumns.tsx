import { Button } from '@/components/Button';
import { DateText } from '@/components/DateText';
import useOrganizationStore from '@/store/organization/organizationStore';
import useEnvironmentStore from '@/store/environment/environmentStore';
import useProjectStore from '@/store/project/projectStore';
import { Environment } from '@/types';
import { getProjectPermission, translate } from '@/utils';
import { GitBranch, LockSimple, LockSimpleOpen } from '@phosphor-icons/react';
import { ColumnDef } from '@tanstack/react-table';
import { SortButton } from '@/components/DataTable';

const { selectEnvironment } = useEnvironmentStore.getState();
const closeVersionDrawer = useProjectStore.getState().closeEnvironmentDrawer;

export const EnvironmentsColumns: ColumnDef<Environment>[] = [
	{
		id: 'name',
		header: () => <SortButton text={translate('general.name')} field='name' />,
		accessorKey: 'name',
		size: 75,
		enableSorting: true,
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
		header: () => <SortButton text={translate('general.created_at')} field='createdAt' />,
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
		header: () => <SortButton text={translate('project.read_write')} field='readOnly' />,
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
					<span className=' text-sm'>
						{readOnly ? translate('project.readOnly') : translate('project.read_write')}
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
