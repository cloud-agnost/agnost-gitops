import { Avatar, AvatarFallback, AvatarImage } from '@/components/Avatar';
import { AppTeam } from '@/types';
import './application.scss';
import { ProjectTeam } from '@/types/project';
interface ApplicationTeamProps {
	team: AppTeam[] | ProjectTeam[];
	table?: boolean;
}
export default function ApplicationTeam({ team, table = false }: ApplicationTeamProps) {
	return (
		<div className='application-team'>
			{team?.slice(0, 4)?.map((member) => (
				<Avatar key={member._id} size={table ? 'xs' : 'sm'}>
					<AvatarImage src={member.userId.pictureUrl} />
					<AvatarFallback name={member.userId.name} color={member.userId.color} isUserAvatar />
				</Avatar>
			))}
			{team?.length > 4 && (
				<Avatar size='xs'>
					<AvatarFallback name={`${team.length - 4}+`} color='#fff' />
				</Avatar>
			)}
		</div>
	);
}
