import { MODULE_PAGE_SIZE } from '@/constants';
import { useInfiniteQuery } from '@tanstack/react-query';
import useUpdateEffect from './useUpdateEffect';
import { useSearchParams, useParams } from 'react-router-dom';
import { BaseParams, BaseGetRequest } from '@/types';
import useApplicationStore from '@/store/app/applicationStore';
import useVersionStore from '@/store/version/versionStore';

interface UseFetchDataProps<T = any> {
	queryFn: (params: BaseGetRequest & BaseParams & T) => Promise<any>;
	lastFetchedPage: number | undefined;
	dataLength: number;
	queryKey: string;
	params?: T;
	disableVersionParams?: boolean;
	enabled?: boolean;
}
export default function useInfiniteScroll({
	queryFn,
	lastFetchedPage,
	dataLength,
	queryKey,
	params,
	disableVersionParams,
	enabled = true,
}: UseFetchDataProps) {
	const [searchParams] = useSearchParams();
	const { orgId, versionId, appId } = useParams() as Record<string, string>;
	const { application } = useApplicationStore();
	const { version } = useVersionStore();
	const result = useInfiniteQuery({
		queryKey: [queryKey],
		initialPageParam: 0,
		queryFn: ({ pageParam }) =>
			queryFn({
				...(!disableVersionParams && {
					orgId,
					versionId: version?._id ?? versionId,
					appId: application?._id ?? appId,
				}),
				page: pageParam,
				size: MODULE_PAGE_SIZE,
				search: searchParams.get('q') as string,
				sortBy: searchParams.get('f') as string,
				sortDir: searchParams.get('d') as string,
				...params,
			}),
		refetchOnWindowFocus: false,
		enabled:
			(lastFetchedPage === undefined ||
				Math.ceil(dataLength / MODULE_PAGE_SIZE) < (lastFetchedPage ?? 0)) &&
			enabled,

		getNextPageParam: (lastPage) => {
			const nextPage =
				lastPage?.length === MODULE_PAGE_SIZE ? (lastFetchedPage ?? 0) + 1 : undefined;
			return nextPage;
		},
	});
	useUpdateEffect(() => {
		result.refetch();
	}, [
		searchParams.get('q'),
		searchParams.get('f'),
		searchParams.get('d'),
		searchParams.get('u'),
		searchParams.get('a'),
		searchParams.get('start'),
		searchParams.get('end'),
	]);

	useUpdateEffect(() => {
		if (orgId && versionId && appId) result.refetch();
	}, [orgId, versionId, appId]);

	return result;
}
