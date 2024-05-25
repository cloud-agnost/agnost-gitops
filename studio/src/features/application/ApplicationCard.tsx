import { Avatar, AvatarFallback, AvatarImage } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { APPLICATION_SETTINGS, BADGE_COLOR_MAP, PROJECT_SETTINGS } from '@/constants';
import useAuthStore from '@/store/auth/authStore';
import { AppRoles, Application } from '@/types';
import { cn, getRelativeTime } from '@/utils';
import { useTranslation } from 'react-i18next';

import { Loading } from '@/components/Loading';
import { Project } from '@/types/project';
import ApplicationSettings from './ApplicationSettings';
import ApplicationTeam from './ApplicationTeam';
import './application.scss';

interface ApplicationCardProps<T extends Application | Project> {
	data: T;
	onClick: (data: T) => void;
	loading: boolean;
	selectedData?: Application;
	type: 'app' | 'project';
}

export default function ApplicationCard<T>({
	data,
	loading,
	onClick,
	selectedData,
	type,
}: ApplicationCardProps<T extends Application | Project ? T : never>) {
	const { user } = useAuthStore();
	const { t } = useTranslation();

	const role = user.isClusterOwner
		? AppRoles.Admin
		: (data.team?.find(({ userId }) => userId._id === user?._id)?.role as string);
	return (
		<button
			className='application-card relative'
			onClick={(e) => {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				//@ts-ignore
				if (e.target.id === 'open-version' || !e.target.id) onClick(data);
			}}
		>
			{loading && data._id === selectedData?._id && (
				<>
					<Loading loading={loading} />
					<div
						className={cn(
							'absolute bg-base/50 w-full h-full z-40 top-0 left-0',
							loading ? 'transition-all duration-100 fade-in' : 'animate-out fade-out',
						)}
					/>
				</>
			)}
			<div className='space-y-4'>
				<div className='flex items-center gap-2'>
					<Avatar size='md' square>
						<AvatarImage src={data?.pictureUrl} />
						<AvatarFallback name={data.name} color={data.color} />
					</Avatar>
					<p className='text-default font-semibold block truncate'>{data.name}</p>
				</div>

				<ApplicationTeam team={data.team} />

				<div className='flex items-center justify-between'>
					<span className='text-subtle font-sfCompact text-xs'>
						{t('general.created')} {getRelativeTime(data.createdAt)}
					</span>
					<div className='flex items-center gap-2'>
						<Badge text={role} variant={BADGE_COLOR_MAP[role?.toUpperCase()]} className='!h-5' />
						<ApplicationSettings
							application={data}
							role={role as AppRoles}
							settings={type === 'app' ? APPLICATION_SETTINGS : PROJECT_SETTINGS}
						/>
					</div>
				</div>
			</div>
		</button>
	);
}
