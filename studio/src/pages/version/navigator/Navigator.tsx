import { BreadCrumb, BreadCrumbItem } from '@/components/BreadCrumb';
import { Button } from '@/components/Button';
import { SelectModel } from '@/features/database';
import { TableHeader } from '@/features/database/models/Navigator';
import { useNavigatorColumns, useToast, useUpdateData } from '@/hooks';
import useSaveColumnState from '@/hooks/useSaveColumnState';
import { VersionTabLayout } from '@/layouts/VersionLayout';
import useDatabaseStore from '@/store/database/databaseStore';
import useModelStore from '@/store/database/modelStore';
import useNavigatorStore from '@/store/database/navigatorStore';
import useUtilsStore from '@/store/version/utilsStore';
import {
	APIError,
	BucketCountInfo,
	ColumnFilters,
	FieldTypes,
	ResourceInstances,
	TabTypes,
} from '@/types';
import { queryBuilder } from '@/utils';
import { ArrowClockwise } from '@phosphor-icons/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CellEditRequestEvent, GridReadyEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react'; // React Grid Logic
import _ from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';
import { Pagination } from './Pagination';

export default function Navigator() {
	const { t } = useTranslation();
	const { toast } = useToast();
	const [searchParams, setSearchParams] = useSearchParams();
	const [selectedRowCount, setSelectedRowCount] = useState(0);
	const { columnFilters, clearAllColumnFilters } = useUtilsStore();
	const {
		getDataFromModel,
		deleteMultipleDataFromModel,
		getDataOfSelectedModel,
		data: stateData,
		subModelData,
		dataCountInfo,
	} = useNavigatorStore();

	const database = useDatabaseStore((state) => state.database);
	const { model, subModel } = useModelStore();
	const canMultiDelete = true;
	const columns = useNavigatorColumns();
	const { orgId, appId, versionId, modelId } = useParams() as Record<string, string>;
	const gridRef = useRef<AgGridReact<any>>(null);
	const { handleColumnStateChange, onFirstDataRendered } = useSaveColumnState(modelId);

	const data = useMemo(() => getDataOfSelectedModel(modelId) ?? [], [modelId, stateData]);
	const modelColumnFilter = useMemo(
		() => columnFilters?.[modelId] ?? [],
		[modelId, columnFilters?.[model._id]],
	);

	const updateData = useUpdateData();
	const dbUrl = `/organization/${orgId}/apps/${appId}/version/${versionId}/database`;

	const { mutateAsync: deleteMultipleMutate } = useMutation({
		mutationFn: deleteMultipleDataFromModel,
		mutationKey: ['deleteMultipleDataFromModel'],
		onSuccess: () => {
			setSelectedRowCount(0);
			gridRef.current?.api.deselectAll();
			refetch();
		},
		onError: ({ details }: APIError) => {
			toast({ action: 'error', title: details });
		},
	});

	async function deleteHandler() {
		const ids = gridRef.current?.api.getSelectedNodes().map((node) => node.data.id);
		deleteMultipleMutate({
			ids,
		});
	}
	function handleExportClick() {
		gridRef.current!.api.exportDataAsCsv();
	}

	function handleClearAllFilters() {
		searchParams.set('filtered', 'false');
		setSearchParams(searchParams);
		clearAllColumnFilters(model._id);
	}

	const breadcrumbItems: BreadCrumbItem[] = [
		{
			name: database.name,
			url: dbUrl,
		},
		{
			name: model?.name,
			url: `${dbUrl}/${database._id}/models`,
		},
		{
			name: t('database.navigator.title').toString(),
		},
	];

	const { refetch, isFetching } = useQuery({
		queryKey: [
			'getDataFromModel',
			modelId,
			searchParams.get('f'),
			searchParams.get('d'),
			searchParams.get('page'),
			searchParams.get('size'),
			searchParams.get('filtered'),
			database.type,
		],
		queryFn: () =>
			getDataFromModel({
				sortBy: searchParams.get('f') as string,
				sortDir: searchParams.get('d') as string,
				page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
				size: searchParams.get('size') ? Number(searchParams.get('size')) : 25,
				dbType: database.type,
				filter: queryBuilder(modelColumnFilter as ColumnFilters),
			}),
		refetchOnWindowFocus: false,
		enabled: modelId === model._id && window.location.pathname.includes(model._id),
	});

	function onCellEditRequest(event: CellEditRequestEvent) {
		const oldData = event.data;
		const field = event.colDef.field;
		if (!field) return;
		let newValue = event.newValue;
		const newData = { ...oldData };
		newData[field] = event.newValue;

		const tx = {
			update: [newData],
		};
		if (event.colDef.cellEditorParams.type === FieldTypes.JSON) {
			newValue = JSON.parse(event.newValue.toString() ?? '');
		}

		if (event.colDef.cellEditorParams.type === FieldTypes.GEO_POINT) {
			const coords = {
				lat:
					database.type === ResourceInstances.MongoDB
						? event.newValue?.coordinates?.[0]
						: event.newValue?.x,
				lng:
					database.type === ResourceInstances.MongoDB
						? event.newValue?.coordinates?.[1]
						: event.newValue?.y,
			};
			newValue = [coords.lat, coords.lng];
		}

		event.api.applyTransaction(tx);

		updateData(
			{
				[field]: newValue,
			},
			oldData.id,
			event.node.rowIndex as number,
			field,
		);
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

	useEffect(() => {
		if (!_.isNil(gridRef.current?.api)) {
			if (isFetching) {
				gridRef.current.api.showLoadingOverlay();
			} else if (data.length === 0) {
				gridRef.current.api.showNoRowsOverlay();
			} else {
				gridRef.current.api.hideOverlay();
			}
		}
	}, [data, gridRef.current, isFetching]);

	function onGridReady(event: GridReadyEvent) {
		event.api.showLoadingOverlay();
		if (model.fields.length <= 5) event.api.sizeColumnsToFit();
	}

	return (
		<VersionTabLayout
			isEmpty={false}
			type={TabTypes.Navigator}
			disabled={!canMultiDelete}
			onMultipleDelete={deleteHandler}
			loading={false}
			className='!overflow-hidden'
			breadCrumb={<BreadCrumb items={breadcrumbItems} />}
			selectedRowCount={selectedRowCount}
			onClearSelected={() => gridRef.current?.api.deselectAll()}
			handlerButton={
				<>
					<Button variant='outline' onClick={handleExportClick} disabled={!canMultiDelete}>
						Export as CSV
					</Button>
					{!_.isEmpty(modelColumnFilter) && (
						<Button variant='outline' onClick={handleClearAllFilters} disabled={!canMultiDelete}>
							Clear Filters
						</Button>
					)}
					<Button variant='secondary' onClick={() => refetch()} iconOnly disabled={isFetching}>
						<ArrowClockwise className='mr-1 text-sm' />
						{t('general.refresh')}
					</Button>

					<SelectModel />
				</>
			}
		>
			<div className='ag-theme-alpine-dark h-full flex flex-col rounded'>
				<AgGridReact
					className='w-full h-full'
					onGridReady={onGridReady}
					key={model._id}
					ref={gridRef}
					rowData={!_.isEmpty(subModel) ? subModelData : data}
					columnDefs={columns}
					rowSelection='multiple'
					stopEditingWhenCellsLoseFocus
					components={{
						agColumnHeader: TableHeader,
					}}
					readOnlyEdit={true}
					onCellEditRequest={onCellEditRequest}
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
				{!isFetching && <Pagination countInfo={dataCountInfo?.[modelId] as BucketCountInfo} />}
			</div>
		</VersionTabLayout>
	);
}
