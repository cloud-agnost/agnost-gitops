import { Avatar, AvatarFallback, AvatarImage } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Loading } from '@/components/Loading';
import { BADGE_COLOR_MAP } from '@/constants';
import useAuthStore from '@/store/auth/authStore';
import { Project, ProjectRole } from '@/types/project';
import { cn, getRelativeTime } from '@/utils';
import { useTranslation } from 'react-i18next';
import ProjectSettings from './ProjectSettings';
import ProjectTeam from './ProjectTeam';

interface ProjectCardProps {
	data: Project;
	onClick: (data: Project) => void;
	loading: boolean;
	selectedData?: Project;
}
export default function ProjectCard({ data, loading, onClick, selectedData }: ProjectCardProps) {
	const { user } = useAuthStore();
	const { t } = useTranslation();

	const role = user.isClusterOwner
		? ProjectRole.Admin
		: (data.team?.find(({ userId }) => userId._id === user?._id)?.role as string);
	return (
		<button
			className='p-3 border border-border bg-subtle rounded hover:border-border-hover relative w-[326px] h-[144px]'
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

				<ProjectTeam team={data.team} />

				<div className='flex items-center justify-between'>
					<span className='text-subtle  text-xs'>
						{t('general.created')} {getRelativeTime(data.createdAt)}
					</span>
					<div className='flex items-center gap-2'>
						<Badge text={role} variant={BADGE_COLOR_MAP[role?.toUpperCase()]} className='!h-5' />
						<ProjectSettings project={data} role={role as ProjectRole} />
					</div>
				</div>
			</div>
		</button>
	);
}
