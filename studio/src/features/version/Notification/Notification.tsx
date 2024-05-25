import { Avatar, AvatarFallback, AvatarImage } from '@/components/Avatar';
import { DateText } from '@/components/DateText';
import { Notification } from '@/types';

export default function MainNotification({ notification }: { notification: Notification }) {
	return (
		<div className='grid grid-cols-3 p-5'>
			<div className='flex items-center gap-4'>
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
					<p className='text-xs text-subtle font-sfCompact'>{notification.actor.contactEmail}</p>
				</div>
			</div>
			<p className='text-sm text-default font-sfCompact flex-[0.8]'>{notification.description}</p>
			<DateText date={notification.createdAt} className='justify-center' />
		</div>
	);
}
