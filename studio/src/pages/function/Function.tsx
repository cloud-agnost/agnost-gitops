import { DataTable } from '@/components/DataTable';
import { TableLoading } from '@/components/Table/Table';
import { FunctionColumns } from '@/features/function';
import { useInfiniteScroll, useTable, useToast } from '@/hooks';
import useAuthorizeVersion from '@/hooks/useAuthorizeVersion';
import { VersionTabLayout } from '@/layouts/VersionLayout';
import useFunctionStore from '@/store/function/functionStore';
import { APIError, HelperFunction, TabTypes } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useParams } from 'react-router-dom';

export default function MainFunction() {
	const { t } = useTranslation();
	const { toast } = useToast();
	const canCreate = useAuthorizeVersion('function.create');
	const { functions, lastFetchedPage, getFunctions, deleteMultipleFunctions, toggleCreateModal } =
		useFunctionStore();
	const table = useTable({
		data: functions,
		columns: FunctionColumns,
	});
	const { versionId, orgId, appId } = useParams();

	const { mutateAsync: deleteFunction } = useMutation({
		mutationFn: deleteMultipleFunctions,
		onSuccess: () => {
			table?.toggleAllRowsSelected(false);
		},
		onError: (error: APIError) => {
			toast({
				title: error.details,
				action: 'error',
			});
		},
	});

	function deleteMultipleFunctionsHandler() {
		deleteFunction({
			functionIds: table.getSelectedRowModel().rows.map((row) => row.original._id),
			orgId: orgId as string,
			appId: appId as string,
			versionId: versionId as string,
		});
	}
	const { fetchNextPage, hasNextPage, isFetchingNextPage, isFetching } = useInfiniteScroll({
		queryFn: getFunctions,
		dataLength: functions.length,
		lastFetchedPage,
		queryKey: 'functions',
	});

	return (
		<VersionTabLayout
			searchable
			type={TabTypes.Function}
			title={t('function.title') as string}
			isEmpty={!functions.length}
			openCreateModal={toggleCreateModal}
			onMultipleDelete={deleteMultipleFunctionsHandler}
			disabled={!canCreate}
			loading={isFetching && !functions.length}
			selectedRowCount={table.getSelectedRowModel().rows.length}
			onClearSelected={() => table.toggleAllRowsSelected(false)}
		>
			<InfiniteScroll
				scrollableTarget='version-layout'
				dataLength={functions.length}
				next={fetchNextPage}
				hasMore={hasNextPage}
				loader={isFetchingNextPage && <TableLoading />}
			>
				<DataTable<HelperFunction> table={table} />
			</InfiniteScroll>
		</VersionTabLayout>
	);
}
