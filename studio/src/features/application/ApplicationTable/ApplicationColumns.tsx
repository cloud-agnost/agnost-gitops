import { Avatar, AvatarFallback, AvatarImage } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { SortButton } from '@/components/DataTable';
import { APPLICATION_SETTINGS, BADGE_COLOR_MAP, PROJECT_SETTINGS } from '@/constants';
import { ApplicationSettings, ApplicationTeam } from '@/features/application';
import useApplicationStore from '@/store/app/applicationStore';
import useAuthStore from '@/store/auth/authStore';
import { AppRoles, Application, ColumnDefWithClassName } from '@/types';
import { getRelativeTime, translate } from '@/utils';
import { ArrowClockwise } from '@phosphor-icons/react';
const user = useAuthStore.getState().user;

function isAppLoading(application: Application): boolean {
	const { application: selectedApp, loading } = useApplicationStore.getState();
	return loading && selectedApp?._id === application._id;
}
export const ApplicationColumns: ColumnDefWithClassName<Application>[] = [
	{
		id: 'name',
		header: () => <SortButton text={translate('application.table.name')} field='name' />,
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
						loading={isAppLoading(row.original)}
						onClick={() => useApplicationStore.getState().onAppClick(row.original)}
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
		header: () => <SortButton text={translate('application.table.role')} field='role' />,
		accessorKey: 'role',
		sortingFn: 'text',
		cell: ({ row }) => {
			const { team } = row.original;
			const role = user.isClusterOwner
				? AppRoles.Admin
				: (team.find((member) => member._id !== useAuthStore.getState().user?._id)?.role as string);
			return <Badge text={role} variant={BADGE_COLOR_MAP[role.toUpperCase()]} />;
		},
	},

	{
		id: 'date',
		header: () => <SortButton text={translate('application.table.createdAt')} field='createdAt' />,
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
		header: translate('application.table.team'),
		cell: ({ row }) => {
			const { team } = row.original;
			return <ApplicationTeam team={team} table />;
		},
	},
	{
		id: 'actions',
		className: '!w-[50px]',
		cell: ({ row }) => {
			const { team, iid } = row.original;
			const me = team.find((member) => member.userId._id === user?._id);
			return (
				<ApplicationSettings
					application={row.original}
					role={me?.role as AppRoles}
					settings={iid.includes('app') ? APPLICATION_SETTINGS : PROJECT_SETTINGS}
				/>
			);
		},
	},
];
