import { EmptyState } from '@/components/EmptyState';
import { Loading } from '@/components/Loading';
import { TableLoading } from '@/components/Table/Table';
import { Notification, NotificationFilter } from '@/features/version/Notification';
import { useInfiniteScroll } from '@/hooks';
import useVersionStore from '@/store/version/versionStore';
import { NotificationActions, TabTypes } from '@/types';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useSearchParams } from 'react-router-dom';

export default function VersionNotifications() {
	const { t } = useTranslation();
	const { notifications, getVersionNotifications, notificationLastFetchedCount } =
		useVersionStore();
	const [searchParams] = useSearchParams();

	const { fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } = useInfiniteScroll({
		queryFn: getVersionNotifications,
		queryKey: 'versionNotifications',
		dataLength: notifications.length,
		lastFetchedPage: notificationLastFetchedCount,
		params: {
			size: 50,
			sortBy: 'createdAt',
			sortDir: 'desc',
			actor: searchParams.get('u')?.split(',') ?? undefined,
			start: searchParams.get('start') ?? undefined,
			end: searchParams.get('end') ?? undefined,
			action: (searchParams.get('a')?.split(',') as NotificationActions[]) ?? undefined,
		},
	});

	return (
		<div className='flex gap-6 h-full'>
			<NotificationFilter />
			<div className='border border-border rounded-lg flex-1 relative'>
				<div className='bg-subtle p-6 border-b border-border'>
					<h1 className='text-default text-xl'>{t('version.notifications')}</h1>
				</div>
				{isFetching ? (
					<Loading loading={isFetching} />
				) : (
					<div className='scroll p-6 divide-y-2' id='scrollableDiv'>
						{!_.isEmpty(notifications) ? (
							<InfiniteScroll
								scrollableTarget='scrollableDiv'
								dataLength={notifications.length}
								next={fetchNextPage}
								hasMore={hasNextPage}
								loader={isFetchingNextPage && <TableLoading />}
								className='divide-y-2'
							>
								{notifications.map((notification) => (
									<Notification notification={notification} key={notification._id} />
								))}
							</InfiniteScroll>
						) : (
							<EmptyState title={t('version.noNotifications')} type={TabTypes.Notifications} />
						)}
					</div>
				)}
			</div>
		</div>
	);
}
