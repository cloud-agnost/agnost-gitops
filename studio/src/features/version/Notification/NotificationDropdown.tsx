import { Avatar, AvatarFallback, AvatarImage } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/Tooltip';
import useTabStore from '@/store/version/tabStore';
import useVersionStore from '@/store/version/versionStore';
import { Notification, TabTypes } from '@/types';
import { cn, generateId, getRelativeTime } from '@/utils';
import { Bell, GearSix } from '@phosphor-icons/react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from 'components/Dropdown';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

export default function NotificationDropdown() {
	const { t } = useTranslation();
	const { notificationsPreview, updateNotificationLastSeen, getVersionNotificationsPreview } =
		useVersionStore();
	const { getVersionDashboardPath, version } = useVersionStore();
	const { addTab } = useTabStore();
	const { orgId, versionId, appId } = useParams() as Record<string, string>;
	function seeAllNotifications() {
		const versionHomePath = getVersionDashboardPath('/notifications');
		addTab(version?._id, {
			id: generateId(),
			title: t('version.notifications'),
			path: versionHomePath,
			isActive: true,
			isDashboard: false,
			type: TabTypes.Notifications,
		});
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
	}
	useEffect(() => {
		if (orgId && versionId && appId) {
			getVersionNotificationsPreview({
				appId,
				orgId,
				versionId,
				page: 0,
				size: 100,
				sortBy: 'createdAt',
				sortDir: 'desc',
			});
		}
	}, [versionId]);
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant='icon' size='sm' rounded className='relative'>
					<Bell size={18} />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className={cn('relative p-0 w-[24rem] mr-4  divide-y-2')}>
				<DropdownMenuLabel className='relative flex justify-between items-center px-4 py-1'>
					<p className='truncate text-default'>{t('version.notifications')}</p>
					<Button variant='blank' className='link' onClick={updateNotificationLastSeen}>
						{t('version.mark_all_as_read')}
					</Button>
				</DropdownMenuLabel>
				<div className='max-h-[33rem] overflow-auto'>
					{notificationsPreview.map((notification) => (
						<NotificationItem notification={notification} key={notification._id} />
					))}
				</div>
				<footer className='flex items-center justify-between px-4 py-1'>
					<div className='p-2 hover:bg-button-border-hover rounded-full'>
						<Link to={`/organization/${orgId}/profile/notifications`}>
							<GearSix size={20} className=' text-icon-secondary' />
						</Link>
					</div>
					<Button variant='link' onClick={seeAllNotifications}>
						{t('version.view_all_notifications')}
					</Button>
				</footer>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function NotificationItem({ notification }: { notification: Notification }) {
	const { notificationLastSeen } = useVersionStore();
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
