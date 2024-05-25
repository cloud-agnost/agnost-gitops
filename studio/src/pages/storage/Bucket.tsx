import { BreadCrumb, BreadCrumbItem } from '@/components/BreadCrumb';
import { Button } from '@/components/Button';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { MODULE_PAGE_SIZE } from '@/constants';
import { TableHeader } from '@/features/database/models/Navigator';
import { BucketColumns, CreateBucket } from '@/features/storage';
import { useToast } from '@/hooks';
import useSaveColumnState from '@/hooks/useSaveColumnState';
import { VersionTabLayout } from '@/layouts/VersionLayout';
import useStorageStore from '@/store/storage/storageStore';
import useUtilsStore from '@/store/version/utilsStore';
import { APIError, BucketCountInfo, ColumnFilters, TabTypes } from '@/types';
import { mongoQueryConverter } from '@/utils/mongoQueryConverter';
import { ArrowClockwise } from '@phosphor-icons/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { GridReadyEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css'; // Core CSS
import 'ag-grid-community/styles/ag-theme-alpine.css'; // Theme
import { AgGridReact } from 'ag-grid-react'; // React Grid Logic
import _ from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';
import { Pagination } from '../version/navigator/Pagination';
export default function Buckets() {
	const [isBucketCreateOpen, setIsBucketCreateOpen] = useState(false);
	const { toast } = useToast();
	const { t } = useTranslation();
	const { versionId, orgId, appId, storageId } = useParams() as Record<string, string>;
	const [searchParams, setSearchParams] = useSearchParams();
	const [selectedRowCount, setSelectedRowCount] = useState(0);
	const gridRef = useRef<AgGridReact<any>>(null);
	const { columnFilters, clearAllColumnFilters } = useUtilsStore();
	const bucketColumnFilter = useMemo(
		() => columnFilters?.[storageId] ?? [],
		[storageId, columnFilters?.[storageId]],
	);
	const {
		getBuckets,
		closeBucketDeleteDialog,
		buckets,
		toDeleteBucket,
		isBucketDeleteDialogOpen,
		deleteBucket,
		deleteMultipleBuckets,
		bucketCountInfo,
		storage,
	} = useStorageStore();
	const { handleColumnStateChange, onFirstDataRendered } = useSaveColumnState(storageId);
	const storageUrl = `/organization/${orgId}/apps/${appId}/version/${versionId}/storage`;
	const breadcrumbItems: BreadCrumbItem[] = [
		{
			name: t('storage.title').toString(),
			url: storageUrl,
		},
		{
			name: storage?.name,
		},
	];

	const { refetch, isFetching, isRefetching } = useQuery({
		queryKey: [
			'getBuckets',
			storage?.name,
			searchParams.get('q'),
			searchParams.get('page'),
			searchParams.get('size'),
			searchParams.get('d'),
			searchParams.get('f'),
			searchParams.get('filtered'),
		],
		queryFn: () =>
			getBuckets({
				page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
				size: searchParams.get('size') ? Number(searchParams.get('size')) : MODULE_PAGE_SIZE,
				returnCountInfo: true,
				search: searchParams.get('q') as string,
				storageName: storage?.name,
				sortBy: searchParams.get('f') as string,
				sortDir: searchParams.get('d') as string,
				filter: mongoQueryConverter(bucketColumnFilter as ColumnFilters),
			}),
		refetchOnWindowFocus: false,
	});
	const {
		mutateAsync: deleteBucketMutation,
		isPending: deleteLoading,
		error: deleteError,
		reset,
	} = useMutation({
		mutationFn: () =>
			deleteBucket({
				storageName: storage?.name,
				bucketName: toDeleteBucket?.name as string,
				versionId: storage?.versionId,
			}),

		onSuccess: () => {
			refetch();
			closeBucketDeleteDialog();
		},
	});
	const { mutateAsync: deleteMultipleBucketsMutation } = useMutation({
		mutationFn: () =>
			deleteMultipleBuckets({
				deletedBuckets: gridRef.current?.api.getSelectedNodes().map(({ data: bucket }) => ({
					id: bucket.id,
					name: bucket.name,
				})) as { id: string; name: string }[],
				storageName: storage?.name,
				versionId: storage?.versionId,
			}),
		onSuccess: () => {
			setSelectedRowCount(0);
			gridRef.current?.api.deselectAll();
			refetch();
		},
		onError: ({ details }: APIError) => {
			toast({ action: 'error', title: details });
		},
	});

	function handleClearAllFilters() {
		searchParams.set('filtered', 'false');
		setSearchParams(searchParams);
		clearAllColumnFilters(storageId);
	}

	useEffect(() => {
		refetch();
	}, [versionId, orgId, appId, storageId]);

	function onGridReady(event: GridReadyEvent) {
		event.api.sizeColumnsToFit();
	}

	useEffect(() => {
		if (!_.isNil(gridRef.current?.api)) {
			if (isFetching) {
				gridRef.current.api.showLoadingOverlay();
			} else {
				gridRef.current.api.hideOverlay();
			}
		}
	}, [isFetching, gridRef.current]);

	return (
		<>
			<VersionTabLayout
				isEmpty={false}
				type={TabTypes.Bucket}
				openCreateModal={() => setIsBucketCreateOpen(true)}
				onMultipleDelete={deleteMultipleBucketsMutation}
				loading={isFetching && !buckets.length}
				breadCrumb={<BreadCrumb items={breadcrumbItems} />}
				selectedRowCount={selectedRowCount}
				onClearSelected={() => gridRef.current?.api.deselectAll()}
				handlerButton={
					<>
						<Button variant='secondary' onClick={() => refetch()} iconOnly loading={isRefetching}>
							{!isRefetching && <ArrowClockwise className='mr-1 w-3.5 h-3.5' />}
							{t('general.refresh')}
						</Button>
						{!_.isEmpty(bucketColumnFilter) && (
							<Button variant='outline' onClick={handleClearAllFilters}>
								Clear Filters
							</Button>
						)}
					</>
				}
			>
				<div className='ag-theme-alpine-dark h-full flex flex-col rounded'>
					<AgGridReact
						className='w-full h-full'
						onGridReady={onGridReady}
						key={storage.name}
						ref={gridRef}
						rowData={buckets}
						columnDefs={BucketColumns}
						rowSelection='multiple'
						components={{
							agColumnHeader: TableHeader,
						}}
						readOnlyEdit={true}
						ensureDomOrder
						suppressRowClickSelection
						enableCellTextSelection
						overlayLoadingTemplate={
							'<div class="flex space-x-6 justify-center items-center h-screen"><span class="sr-only">Loading...</span><div class="size-5 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div><div class="size-5 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div><div class="size-5 bg-brand-primary rounded-full animate-bounce"></div></div>'
						}
						overlayNoRowsTemplate='<div class="flex justify-center items-center h-screen"><span class="text-lg text-gray-400">No Data Available</span></div>'
						onRowSelected={() =>
							setSelectedRowCount(gridRef.current?.api.getSelectedNodes().length ?? 0)
						}
						suppressMovableColumns
						onFirstDataRendered={onFirstDataRendered}
						onColumnResized={handleColumnStateChange}
						onColumnValueChanged={handleColumnStateChange}
						onColumnMoved={handleColumnStateChange}
						defaultColDef={{
							resizable: true,
						}}
					/>
					<Pagination countInfo={bucketCountInfo as BucketCountInfo} />
				</div>
				<ConfirmationModal
					loading={deleteLoading}
					error={deleteError}
					title={t('storage.bucket.delete.title')}
					alertTitle={t('storage.bucket.delete.message')}
					alertDescription={t('storage.bucket.delete.description')}
					description={
						<Trans
							i18nKey='storage.bucket.delete.confirmCode'
							values={{ confirmCode: toDeleteBucket?.id }}
							components={{
								confirmCode: <span className='font-bold text-default' />,
							}}
						/>
					}
					confirmCode={toDeleteBucket?.id as string}
					onConfirm={deleteBucketMutation}
					isOpen={isBucketDeleteDialogOpen}
					closeModal={() => {
						reset();
						closeBucketDeleteDialog();
					}}
					closable
				/>
			</VersionTabLayout>
			<CreateBucket open={isBucketCreateOpen} onClose={() => setIsBucketCreateOpen(false)} />
		</>
	);
}
