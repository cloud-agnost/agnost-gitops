import { Avatar, AvatarFallback, AvatarImage } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { SortButton } from '@/components/DataTable';
import { BADGE_COLOR_MAP } from '@/constants';
import useAuthStore from '@/store/auth/authStore';
import useProjectStore from '@/store/project/projectStore';
import { ColumnDefWithClassName, Project, ProjectRole } from '@/types';
import { getRelativeTime, translate } from '@/utils';
import { ArrowClockwise } from '@phosphor-icons/react';
import ProjectSettings from './ProjectSettings';
import ProjectTeam from './ProjectTeam';
const user = useAuthStore.getState().user;

function isProjectLoading(project: Project): boolean {
	const { project: selectedProject, loading } = useProjectStore.getState();
	return loading && selectedProject?._id === project._id;
}
export const ProjectColumns: ColumnDefWithClassName<Project>[] = [
	{
		id: 'name',
		header: () => <SortButton text={translate('project.name')} field='name' />,
		size: 900,
		accessorKey: 'name',
		sortingFn: 'text',
		cell: ({ row }) => {
			const { pictureUrl, name, color } = row.original;
			return (
				<div className='flex items-center gap-5'>
					<Avatar square size='md'>
						<AvatarImage src={pictureUrl} />
						<AvatarFallback name={name} color={color} />
					</Avatar>
					<Button
						variant='blank'
						loading={isProjectLoading(row.original)}
						onClick={() => useProjectStore.getState().onProjectClick(row.original)}
						className='ml-2 link justify-start'
					>
						{name}
					</Button>
				</div>
			);
		},
	},
	{
		id: 'role',
		header: () => <SortButton text={translate('project.role')} field='role' />,
		accessorKey: 'role',
		sortingFn: 'text',
		cell: ({ row }) => {
			const { team } = row.original;
			const role = user.isClusterOwner
				? ProjectRole.Admin
				: (team.find((member) => member._id !== useAuthStore.getState().user?._id)?.role as string);
			return <Badge text={role} variant={BADGE_COLOR_MAP[role.toUpperCase()]} />;
		},
	},

	{
		id: 'date',
		header: () => <SortButton text={translate('project.createdAt')} field='createdAt' />,
		accessorKey: 'createdAt',
		sortingFn: 'datetime',
		cell: ({ row }) => {
			const { createdAt } = row.original;
			return (
				<div className='flex gap-1 items-center'>
					<ArrowClockwise className='w-4 h-4 text-subtle mr-2' />
					{getRelativeTime(createdAt)}
				</div>
			);
		},
	},
	{
		id: 'team',
		header: translate('project.team'),
		cell: ({ row }) => {
			const { team } = row.original;
			return <ProjectTeam team={team} table />;
		},
	},
	{
		id: 'actions',
		className: '!w-[50px]',
		cell: ({ row }) => {
			const { team } = row.original;
			const me = team.find((member) => member.userId._id === user?._id);
			return <ProjectSettings project={row.original} role={me?.role as ProjectRole} />;
		},
	},
];
