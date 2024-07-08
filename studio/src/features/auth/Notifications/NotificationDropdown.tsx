import { Avatar, AvatarFallback, AvatarImage } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/Tooltip';
import useNotificationStore from '@/store/notification/notificationStore';
import { Notification } from '@/types';
import { cn, getRelativeTime } from '@/utils';
import { Bell } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from 'components/Dropdown';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
export default function NotificationDropdown() {
	const { t } = useTranslation();
	const { notificationsPreview, updateNotificationLastSeen, getNotificationsPreview } =
		useNotificationStore();
	const navigate = useNavigate();
	const { orgId, envId, projectId } = useParams() as Record<string, string>;
	function seeAllNotifications() {
		navigate(`/notifications`);
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
	}

	useQuery({
		queryKey: ['notificationsPreview'],
		queryFn: () =>
			getNotificationsPreview({
				page: 0,
				size: 100,
				sortBy: 'createdAt',
				sortDir: 'desc',
				orgId,
				envId,
				projectId,
			}),
		enabled: !!orgId,
	});
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant='icon' size='sm' rounded className='relative'>
					<Bell size={18} />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className={cn('relative p-0 w-[24rem] mr-4  divide-y-2')}>
				<DropdownMenuLabel className='relative flex justify-between items-center px-4 py-1'>
					<p className='truncate text-default'>{t('organization.notifications')}</p>
					<Button variant='blank' className='link' onClick={updateNotificationLastSeen}>
						{t('organization.mark_all_as_read')}
					</Button>
				</DropdownMenuLabel>
				<div className='max-h-[33rem] overflow-auto'>
					{notificationsPreview.map((notification) => (
						<NotificationItem notification={notification} key={notification._id} />
					))}
				</div>
				<footer className='flex items-center justify-between px-4 py-1'>
					<Button variant='link' onClick={seeAllNotifications}>
						{t('organization.view_all_notifications')}
					</Button>
				</footer>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function NotificationItem({ notification }: { notification: Notification }) {
	const { notificationLastSeen } = useNotificationStore();
	return (
		<div className='py-1.5 px-4 relative flex items-center gap-4'>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Avatar size='sm' className='self-start cursor-default mt-1'>
							<AvatarImage src={notification.actor.pictureUrl as string} />
							<AvatarFallback
								isUserAvatar
								color={notification.actor.color as string}
								name={notification.actor.name}
								className='text-sm'
							/>
						</Avatar>
					</TooltipTrigger>
					<TooltipContent>{notification.actor.name}</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			<div className='space-y-1 flex-1'>
				<Description description={notification.description} />
				<div className='text-subtle text-[10px]'>{getRelativeTime(notification.createdAt)}</div>
			</div>

			<div
				className={cn(
					'w-2 h-2 rounded-full bg-elements-blue',
					notificationLastSeen < new Date(notification.createdAt) ? 'visible' : 'invisible',
				)}
			/>
		</div>
	);
}

function Description({ description }: { description: string }) {
	const regex = /'([^']+)'/g;
	let lastIndex = 0;
	const elements = [];

	while (description.length > lastIndex) {
		const match = regex.exec(description);
		if (!match) break;

		// Text before the quoted text
		const textBefore = description.substring(lastIndex, match.index);
		if (textBefore) {
			elements.push(<span className='text-subtle font-sfCompact text-xs'>{textBefore}</span>);
		}

		elements.push(
			<span key={match.index} className='text-subtle font-bold font-sfCompact text-xs'>
				{match[0].replace(/'/g, '')}
			</span>,
		);

		lastIndex = match.index + match[0].length;
	}

	const textAfter = description.substring(lastIndex);
	if (textAfter) {
		elements.push(<span className='text-subtle font-sfCompact text-xs'>{textAfter}</span>);
	}

	return <div className='inline break-words'>{elements}</div>;
}
