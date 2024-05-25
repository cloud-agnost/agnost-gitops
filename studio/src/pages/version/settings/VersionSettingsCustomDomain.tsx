import { Feedback } from '@/components/Alert';
import { DataTable } from '@/components/DataTable';
import { TableLoading } from '@/components/Table/Table';
import { AddVersionDomain, VersionDomainColumns } from '@/features/version/CustomDomain';
import { useAuthorizeVersion, useInfiniteScroll, useTable, useToast } from '@/hooks';
import { VersionTabLayout } from '@/layouts/VersionLayout';
import useClusterStore from '@/store/cluster/clusterStore';
import useSettingsStore from '@/store/version/settingsStore';
import { TabTypes } from '@/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useParams } from 'react-router-dom';

export default function VersionSettingsCustomDomain() {
	const { t } = useTranslation();
	const canCreate = useAuthorizeVersion('version.domain.create');
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const { toast } = useToast();
	const { versionId, orgId, appId } = useParams() as Record<string, string>;
	const {
		getCustomDomainsOfVersion,
		versionDomains,
		lastFetchedDomainPage,
		deleteMultipleCustomDomains,
	} = useSettingsStore();
	const { checkDomainStatus, clusterDomainError } = useClusterStore();
	const { getClusterInfo, cluster } = useClusterStore();
	const table = useTable({
		data: versionDomains,
		columns: VersionDomainColumns,
	});

	const { mutateAsync: deleteDomain } = useMutation({
		mutationFn: deleteMultipleCustomDomains,
		onSuccess: () => {
			refetch();
			table?.toggleAllRowsSelected(false);
		},
		onError: (error) => {
			toast({
				title: error.details,
				action: 'error',
			});
		},
	});

	function deleteMultipleDomainsHandler() {
		deleteDomain({
			domainIds: table.getSelectedRowModel().rows.map((row) => row.original._id),
			orgId,
			appId,
			versionId,
		});
	}

	const { fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteScroll({
		queryFn: getCustomDomainsOfVersion,
		queryKey: 'getCustomDomainsOfVersion',
		lastFetchedPage: lastFetchedDomainPage,
		dataLength: versionDomains.length,
	});

	useQuery({
		queryFn: getClusterInfo,
		queryKey: ['getClusterInfo'],
		enabled: _.isEmpty(cluster),
	});

	useQuery({
		queryFn: checkDomainStatus,
		queryKey: ['checkDomainStatus'],
		retry: false,
		enabled: _.isNil(clusterDomainError),
	});

	return (
		<>
			{!_.isNil(clusterDomainError) ? (
				<div className='h-full flex flex-col items-center justify-center'>
					<Feedback
						title={clusterDomainError?.error}
						description={clusterDomainError?.details}
						className='max-w-2xl'
					/>
				</div>
			) : (
				<VersionTabLayout
					type={TabTypes.CustomDomains}
					title={t('cluster.custom_domain') as string}
					isEmpty={!versionDomains.length}
					openCreateModal={() => setIsCreateModalOpen(true)}
					onMultipleDelete={deleteMultipleDomainsHandler}
					selectedRowCount={table.getSelectedRowModel().rows.length}
					onClearSelected={() => table.toggleAllRowsSelected(false)}
					disabled={!canCreate}
					loading={false}
				>
					<InfiniteScroll
						scrollableTarget='setting-container-content'
						dataLength={versionDomains.length}
						next={fetchNextPage}
						hasMore={hasNextPage}
						loader={isFetchingNextPage && <TableLoading />}
					>
						<DataTable
							table={table}
							className='version-settings-table table-fixed'
							containerClassName='version-settings-table-container'
						/>
					</InfiniteScroll>
				</VersionTabLayout>
			)}
			<AddVersionDomain open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
		</>
	);
}
