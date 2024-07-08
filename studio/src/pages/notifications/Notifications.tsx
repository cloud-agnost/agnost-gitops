import { EmptyState } from '@/components/EmptyState';
import { Loading } from '@/components/Loading';
import { TableLoading } from '@/components/Table/Table';
import { MODULE_PAGE_SIZE } from '@/constants';
import { Notification, NotificationFilter } from '@/features/auth/Notifications';
import { Layout } from '@/layouts/Layout';
import useNotificationStore from '@/store/notification/notificationStore';
import { NotificationActions } from '@/types';
import { useInfiniteQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useSearchParams } from 'react-router-dom';

export default function Notifications() {
	const { t } = useTranslation();

	const { notifications, getNotifications, notificationLastFetchedPage } = useNotificationStore();
	const [searchParams] = useSearchParams();
	const { fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, refetch } = useInfiniteQuery({
		queryFn: ({ pageParam = 0 }) =>
			getNotifications({
				page: pageParam,
				size: MODULE_PAGE_SIZE,
				sortBy: 'createdAt',
				sortDir: 'desc',
				actor: searchParams.get('actor')?.split(',') ?? undefined,
				start: searchParams.get('start') ?? undefined,
				end: searchParams.get('end') ?? undefined,
				action: (searchParams.get('action')?.split(',') as NotificationActions[]) ?? undefined,
				orgId: searchParams.get('orgId') ?? '',
				envId: searchParams.get('envId') ?? undefined,
				projectId: searchParams.get('projectId') ?? undefined,
			}),
		queryKey: ['versionNotifications'],
		refetchOnWindowFocus: false,
		initialPageParam: 0,
		enabled:
			(notificationLastFetchedPage === undefined ||
				Math.ceil(notifications.length / MODULE_PAGE_SIZE) < (notificationLastFetchedPage ?? 0)) &&
			!!searchParams.get('orgId'),

		getNextPageParam: (lastPage: any) => {
			const nextPage =
				lastPage?.length === MODULE_PAGE_SIZE ? (notificationLastFetchedPage ?? 0) + 1 : undefined;
			return nextPage;
		},
	});
	return (
		<Layout>
			<div className='flex gap-6 h-full p-6'>
				<NotificationFilter fetchNotifications={refetch} />
				<div className='border border-border rounded-lg flex-1 relative'>
					<div className='bg-subtle p-6 border-b border-border'>
						<h1 className='text-default text-xl'>{t('organization.notifications')}</h1>
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
								<EmptyState title='There are no notifications' type='notification' />
							)}
						</div>
					)}
				</div>
			</div>
		</Layout>
	);
}
