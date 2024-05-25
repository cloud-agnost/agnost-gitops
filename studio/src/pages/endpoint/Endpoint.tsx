import { Button } from '@/components/Button';
import { DataTable } from '@/components/DataTable';
import { TableLoading } from '@/components/Table/Table';
import { EndpointColumns } from '@/features/endpoints';
import { useInfiniteScroll, useTable, useToast } from '@/hooks';
import useAuthorizeVersion from '@/hooks/useAuthorizeVersion';
import { VersionTabLayout } from '@/layouts/VersionLayout';
import useEndpointStore from '@/store/endpoint/endpointStore';
import useTabStore from '@/store/version/tabStore';
import useVersionStore from '@/store/version/versionStore';
import { APIError, TabTypes } from '@/types';
import { generateId } from '@/utils';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useParams } from 'react-router-dom';

export default function MainEndpoint() {
	const { toast } = useToast();
	const { t } = useTranslation();
	const { versionId, orgId, appId } = useParams();
	const canCreate = useAuthorizeVersion('endpoint.create');
	const { endpoints, lastFetchedPage, getEndpoints, deleteMultipleEndpoints, toggleCreateModal } =
		useEndpointStore();
	const { addTab } = useTabStore();
	const { getVersionDashboardPath } = useVersionStore();
	const table = useTable({
		data: endpoints,
		columns: EndpointColumns,
	});

	const { hasNextPage, fetchNextPage, isFetching, isFetchingNextPage } = useInfiniteScroll({
		queryFn: getEndpoints,
		dataLength: endpoints.length,
		lastFetchedPage,
		queryKey: 'getEndpoints',
	});

	const { mutateAsync: deleteMultipleEpMutation } = useMutation({
		mutationFn: deleteMultipleEndpoints,
		onSuccess: () => {
			table?.resetRowSelection();
		},
		onError: ({ details }: APIError) => {
			toast({ action: 'error', title: details });
		},
	});

	function deleteMultipleEndpointsHandler() {
		deleteMultipleEpMutation({
			endpointIds: table.getSelectedRowModel().rows.map((row) => row.original._id),
			orgId: orgId as string,
			appId: appId as string,
			versionId: versionId as string,
		});
	}

	function openLogTab() {
		addTab(versionId as string, {
			id: generateId(),
			title: t('endpoint.logs'),
			path: getVersionDashboardPath('endpoint/logs'),
			isActive: true,
			isDashboard: false,
			type: TabTypes.Endpoint,
		});
	}

	return (
		<VersionTabLayout
			searchable
			type={TabTypes.Endpoint}
			title={t('endpoint.title') as string}
			isEmpty={!endpoints.length}
			openCreateModal={toggleCreateModal}
			onMultipleDelete={deleteMultipleEndpointsHandler}
			disabled={!canCreate}
			loading={isFetching && !endpoints.length}
			handlerButton={
				<Button variant='secondary' onClick={openLogTab}>
					{t('queue.view_logs')}
				</Button>
			}
			selectedRowCount={table.getSelectedRowModel().rows.length}
			onClearSelected={() => table.toggleAllRowsSelected(false)}
		>
			<InfiniteScroll
				scrollableTarget='version-layout'
				dataLength={endpoints.length}
				next={fetchNextPage}
				hasMore={hasNextPage}
				loader={isFetchingNextPage && <TableLoading />}
			>
				<DataTable table={table} />
			</InfiniteScroll>
		</VersionTabLayout>
	);
}
