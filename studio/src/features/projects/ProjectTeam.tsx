import { Avatar, AvatarFallback, AvatarImage } from '@/components/Avatar';
import { ProjectTeam as Team } from '@/types';

interface TeamProps {
	team: Team[];
	table?: boolean;
}
export default function ProjectTeam({ team, table = false }: TeamProps) {
	return (
		<div className='flex items-center  -space-x-1 overflow-hidden'>
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
