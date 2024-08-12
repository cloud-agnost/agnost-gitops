import { Avatar, AvatarFallback, AvatarImage } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { DateText } from '@/components/DateText';
import { BADGE_COLOR_MAP } from '@/constants';
import { Notification } from '@/types';
import _ from 'lodash';

export default function MainNotification({ notification }: { notification: Notification }) {
	return (
		<div className='flex items-center gap-8 p-5'>
			<div className='flex items-center gap-4 flex-[0.2]'>
				<Avatar size='sm'>
					<AvatarImage src={notification.actor.pictureUrl as string} />
					<AvatarFallback
						isUserAvatar
						color={notification.actor.color as string}
						name={notification.actor.name}
						className='text-sm'
					/>
				</Avatar>
				<div>
					<p className='text-sm text-default font-sfCompact'>{notification.actor.name}</p>
					<p className='text-xs text-subtle font-sfCompact'>{notification.actor.email}</p>
				</div>
			</div>
			<p className='text-sm text-default font-sfCompact flex-[0.8]'>{notification.description}</p>
			<Badge
				variant={BADGE_COLOR_MAP[notification.action.toUpperCase()]}
				className='justify-center w-12'
				text={_.capitalize(notification.action)}
			/>
			<DateText date={notification.createdAt} className='justify-center' />
		</div>
	);
}
