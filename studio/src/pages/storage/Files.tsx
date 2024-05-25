import { BreadCrumb, BreadCrumbItem } from '@/components/BreadCrumb';
import { Button } from '@/components/Button';
import { Progress } from '@/components/Progress';
import { MODULE_PAGE_SIZE } from '@/constants';
import { TableHeader } from '@/features/database/models/Navigator';
import { EditFile, FileColumns } from '@/features/storage';
import { useToast } from '@/hooks';
import useSaveColumnState from '@/hooks/useSaveColumnState';
import { VersionTabLayout } from '@/layouts/VersionLayout';
import useStorageStore from '@/store/storage/storageStore';
import useUtilsStore from '@/store/version/utilsStore';
import useVersionStore from '@/store/version/versionStore';
import { APIError, BucketCountInfo, ColumnFilters, TabTypes } from '@/types';
import { mongoQueryConverter } from '@/utils/mongoQueryConverter';
import { ArrowClockwise } from '@phosphor-icons/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { GridReadyEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import _ from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Pagination } from '../version/navigator/Pagination';
export default function Files() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [selectedRowCount, setSelectedRowCount] = useState(0);
	const gridRef = useRef<AgGridReact<any>>(null);
	const { toast } = useToast();
	const { t } = useTranslation();
	const { getVersionDashboardPath } = useVersionStore();
	const {
		files: stateFiles,
		getFilesOfBucket,
		bucket,
		deleteMultipleFileFromBucket,
		storage,
		uploadFileToBucket,
		isEditFileDialogOpen,
		closeFileEditDialog,
		uploadProgress,
		fileCountInfo: stateInfo,
	} = useStorageStore();
	const { columnFilters, clearAllColumnFilters } = useUtilsStore();
	const files = useMemo(() => stateFiles[bucket.id] ?? [], [bucket.id, stateFiles]);
	const fileCountInfo = useMemo(() => stateInfo?.[bucket.id], [bucket.id, stateInfo]);
	const fileColumnFilter = useMemo(
		() => columnFilters?.[bucket?.id] ?? [],
		[bucket?.id, , columnFilters?.[bucket?.id]],
	);
	const storageUrl = getVersionDashboardPath('/storage');
	const bucketUrl = `${storageUrl}/${storage._id}`;
	const breadcrumbItems: BreadCrumbItem[] = [
		{
			name: t('storage.title').toString(),
			url: storageUrl,
		},
		{
			name: storage.name,
			url: bucketUrl,
		},
		{
			name: bucket?.name,
		},
	];
	const { handleColumnStateChange, onFirstDataRendered } = useSaveColumnState(
		bucket?.name as string,
	);
	const { refetch, isFetching } = useQuery({
		queryKey: [
			'getFilesOfBucket',
			storage?.name,
			bucket?.id,
			bucket?.name,
			searchParams.get('q'),
			searchParams.get('page'),
			searchParams.get('size'),
			searchParams.get('f'),
			searchParams.get('d'),
			searchParams.get('filtered'),
		],
		queryFn: () =>
			getFilesOfBucket({
				page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
				limit: searchParams.get('size') ? Number(searchParams.get('size')) : MODULE_PAGE_SIZE,
				returnCountInfo: true,
				search: searchParams.get('q') as string,
				storageName: storage?.name,
				bckId: bucket?.id,
				bucketName: bucket?.name,
				sortBy: searchParams.get('f') as string,
				sortDir: searchParams.get('d') as string,
				size: searchParams.get('size') ? Number(searchParams.get('size')) : MODULE_PAGE_SIZE,
				filter: mongoQueryConverter(fileColumnFilter as ColumnFilters),
			}),
		refetchOnWindowFocus: false,
	});

	const { mutateAsync: deleteMultipleFileMutation } = useMutation({
		mutationFn: () =>
			deleteMultipleFileFromBucket({
				filePaths: gridRef.current?.api
					.getSelectedNodes()
					.map((node) => node.data.path) as string[],
				storageName: storage?.name,
				bucketName: bucket?.name,
				bckId: bucket?.id,
			}),
		mutationKey: ['deleteMultipleFileFromBucket'],
		onSuccess: () => {
			const page = Number(searchParams.get('page'));
			if (!!fileCountInfo?.pageSize && page > 1) {
				searchParams.set('page', (page - 1).toPrecision());
			} else refetch();

			gridRef.current?.api.deselectAll();
			setSelectedRowCount(0);
		},
		onError: ({ details }: APIError) => {
			toast({ action: 'error', title: details });
		},
	});

	const { mutateAsync: uploadFileMutation, isPending: uploadLoading } = useMutation({
		mutationFn: (files: FileList | null) =>
			uploadFileToBucket({
				bckId: bucket?.id,
				storageName: storage?.name,
				bucketName: bucket?.name,
				isPublic: true,
				upsert: true,
				files: files as FileList,
			}),
		mutationKey: ['uploadFileToBucket'],
		onSuccess: () => {
			toast({ action: 'success', title: t('storage.upload_success') as string });
			useStorageStore.setState({ uploadProgress: 0 });
			refetch();
		},
		onError: (error: APIError) => {
			toast({ action: 'error', title: error.details });
		},
	});

	function uploadFileHandler() {
		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.multiple = true;
		fileInput.onchange = (e) => {
			const files = (e.target as HTMLInputElement).files;
			if (!files) return;
			uploadFileMutation(files);
		};
		fileInput.click();
	}

	function onGridReady(event: GridReadyEvent) {
		event.api.sizeColumnsToFit();
	}

	function handleClearAllFilters() {
		searchParams.set('filtered', 'false');
		setSearchParams(searchParams);
		clearAllColumnFilters(bucket?.id);
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
			{uploadLoading && (uploadProgress > 0 || uploadProgress < 100) && (
				<Progress value={uploadProgress} className='mb-5' />
			)}
			<VersionTabLayout
				searchable
				breadCrumb={<BreadCrumb items={breadcrumbItems} />}
				isEmpty={false}
				type={TabTypes.File}
				openCreateModal={uploadFileHandler}
				onMultipleDelete={deleteMultipleFileMutation}
				loading={isFetching && (!files?.length || files[0].bucketId !== bucket.id)}
				selectedRowCount={selectedRowCount}
				onClearSelected={() => gridRef.current?.api.deselectAll()}
				handlerButton={
					<>
						<Button variant='secondary' onClick={() => refetch()} iconOnly>
							<ArrowClockwise className='mr-1 w-3.5 h-3.5' />
							{t('general.refresh')}
						</Button>
						{!_.isEmpty(fileColumnFilter) && (
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
						key={bucket.name}
						ref={gridRef}
						rowData={files}
						columnDefs={FileColumns}
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
					<Pagination countInfo={fileCountInfo as BucketCountInfo} />
				</div>
				<EditFile open={isEditFileDialogOpen} onClose={closeFileEditDialog} />
			</VersionTabLayout>
		</>
	);
}
