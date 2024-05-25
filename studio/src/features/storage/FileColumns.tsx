import { ActionsCell } from '@/components/ActionsCell';
import { Badge } from '@/components/Badge';
import { Button, buttonVariants } from '@/components/Button';
import { TableConfirmation } from '@/components/Table';
import { toast } from '@/hooks/useToast';
import useEnvironmentStore from '@/store/environment/environmentStore';
import useStorageStore from '@/store/storage/storageStore';
import useUtilsStore from '@/store/version/utilsStore';
import { APIError, BucketFile, ColumnFilters, FieldTypes } from '@/types';
import {
	DATE_TIME_FORMAT,
	convertUTC,
	formatFileSize,
	getVersionPermission,
	translate,
} from '@/utils';
import { mongoQueryConverter } from '@/utils/mongoQueryConverter';
import { Copy, Download, Swap } from '@phosphor-icons/react';
import { QueryClient } from '@tanstack/react-query';
import { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'components/Tooltip';
import { Link } from 'react-router-dom';

const { copyFileInBucket, replaceFileInBucket, openFileEditDialog, deleteFileFromBucket } =
	useStorageStore.getState();

const queryClient = new QueryClient();
async function deleteFileHandler(toDeleteFile: BucketFile) {
	const { bucket, storage, getFilesOfBucket, fileCountInfo } = useStorageStore.getState();
	const { columnFilters } = useUtilsStore.getState();
	const info = fileCountInfo?.[bucket.id];
	return queryClient
		.getMutationCache()
		.build(queryClient, {
			mutationFn: deleteFileFromBucket,
			onError: ({ details }: APIError) => {
				toast({
					title: details,
					action: 'error',
				});

				getFilesOfBucket({
					bckId: bucket.id,
					storageName: storage?.name,
					bucketName: bucket.name,
					limit: info?.pageSize ?? 25,
					size: info?.pageSize ?? 25,
					page: info?.currentPage ?? 1,
					returnCountInfo: true,
					filter: mongoQueryConverter(columnFilters?.[bucket.id] as ColumnFilters),
				});
			},
		})
		.execute({
			bckId: bucket.id,
			storageName: storage?.name,
			bucketName: bucket.name,
			filePath: toDeleteFile.path,
		});
}

function replaceFile(filePath: string) {
	const { bucket, storage } = useStorageStore.getState();
	const input = document.createElement('input');
	input.type = 'file';
	input.onchange = (e) => {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		queryClient
			.getMutationCache()
			.build(queryClient, {
				mutationFn: replaceFileInBucket,
				onSuccess: () => {
					toast({
						title: translate('storage.file.replace_success'),
						action: 'success',
					});
				},
				onError: ({ details }: APIError) => {
					toast({
						title: details,
						action: 'error',
					});
				},
			})
			.execute({
				bckId: bucket.id,
				storageName: storage?.name,
				bucketName: bucket.name,
				filePath,
				file,
			});
	};
	input.click();
}
function copyFile(filePath: string) {
	const { bucket, storage } = useStorageStore.getState();
	queryClient
		.getMutationCache()
		.build(queryClient, {
			mutationFn: copyFileInBucket,
			onSuccess: () => {
				toast({
					title: translate('storage.file.copy_success'),
					action: 'success',
				});
			},
			onError: ({ details }: APIError) => {
				toast({
					title: details,
					action: 'error',
				});
			},
		})
		.execute({
			bckId: bucket.id,
			storageName: storage?.name,
			bucketName: bucket.name,
			filePath,
		});
}
const FileColumns: ColDef<BucketFile>[] = [
	{
		checkboxSelection: true,
		headerCheckboxSelection: true,
		width: 50,
		pinned: 'left',
	},
	{
		field: 'id',
		headerComponentParams: {
			label: translate('general.id'),
			field: 'id',
			type: FieldTypes.TEXT,
			filterable: true,
			entityId: useStorageStore.getState().bucket.id,
		},
	},
	{
		field: 'path',
		headerComponentParams: {
			label: translate('storage.file.path'),
			field: 'path',
			type: FieldTypes.TEXT,
			filterable: true,
			entityId: useStorageStore.getState().bucket.id,
		},
		cellRenderer: ({ value, data }: ICellRendererParams) => {
			const environment = useEnvironmentStore.getState().environment;
			const publicPath = `${window.location.origin}/${environment?.iid}/agnost/object/${data.id}`;
			return (
				<Link to={publicPath} className='link' target='_blank' rel='noopener noreferrer'>
					{value}
				</Link>
			);
		},
	},
	{
		field: 'isPublic',
		headerComponentParams: {
			label: translate('storage.bucket.visibility.title'),
			field: 'isPublic',
			type: FieldTypes.BOOLEAN,
			filterable: true,
			entityId: useStorageStore.getState().bucket.id,
		},
		cellRenderer: ({ value }: ICellRendererParams) => (
			<Badge
				variant={value ? 'green' : 'yellow'}
				text={
					value
						? translate('storage.bucket.visibility.public')
						: translate('storage.bucket.visibility.private')
				}
				rounded
			/>
		),
	},
	{
		field: 'size',
		headerComponentParams: {
			label: translate('storage.file.size'),
			field: 'size',
			type: FieldTypes.INTEGER,
			filterable: true,
			entityId: useStorageStore.getState().bucket.id,
			description: translate('storage.file.size_description'),
		},
		valueFormatter: ({ value }: ValueFormatterParams) => formatFileSize(value),
	},
	{
		field: 'mimeType',
		headerComponentParams: {
			label: translate('storage.file.mimeType'),
			field: 'mimeType',
			type: FieldTypes.TEXT,
			filterable: true,
			entityId: useStorageStore.getState().bucket.id,
		},
	},
	{
		field: 'tags',
		headerComponentParams: {
			label: translate('storage.bucket.tags'),
			field: 'tags',
			type: FieldTypes.TEXT,
			filterable: true,
			entityId: useStorageStore.getState().bucket.id,
		},
		cellRenderer: ({ value }: ICellRendererParams) => {
			return (
				<div className='flex flex-wrap gap-4'>
					{Object.entries(value).map(([key, value]) => (
						<Badge key={key} variant='gray' text={`${key}: ${value}`} rounded />
					))}
				</div>
			);
		},
	},
	{
		field: 'uploadedAt',
		headerComponentParams: {
			label: translate('general.uploadedAt'),
			field: 'uploadedAt',
			type: FieldTypes.DATETIME,
			filterable: true,
			entityId: useStorageStore.getState().bucket.id,
		},
		valueFormatter: ({ value }) => convertUTC(value, DATE_TIME_FORMAT),
	},
	{
		field: 'updatedAt',
		headerComponentParams: {
			label: translate('general.updated_at'),
			field: 'updatedAt',
			type: FieldTypes.DATETIME,
			filterable: true,
			entityId: useStorageStore.getState().bucket.id,
		},
		valueFormatter: ({ value }) => convertUTC(value, DATE_TIME_FORMAT),
	},
	{
		pinned: 'right',
		cellRenderer: ({ data }: ICellRendererParams) => {
			const canEditBucket = getVersionPermission('storage.update');
			const canDeleteBucket = getVersionPermission('storage.delete');
			const environment = useEnvironmentStore.getState().environment;
			const publicPath = `${window.location.origin}/${environment?.iid}/agnost/object/${data.id}`;
			return (
				<div className='flex items-center justify-end'>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant='icon' size='sm' rounded onClick={() => copyFile(data.path)}>
									<Copy size={20} />
								</Button>
							</TooltipTrigger>
							<TooltipContent>{translate('storage.file.copy')}</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant='icon' size='sm' rounded onClick={() => replaceFile(data.path)}>
									<Swap size={20} />
								</Button>
							</TooltipTrigger>
							<TooltipContent>{translate('storage.file.replace')}</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Link
									to={publicPath}
									target='_blank'
									download={data.path}
									className={buttonVariants({
										variant: 'icon',
										size: 'sm',
										rounded: true,
									})}
									rel='noopener noreferrer'
								>
									<Download size={20} />
								</Link>
							</TooltipTrigger>
							<TooltipContent>{translate('storage.file.download')}</TooltipContent>
						</Tooltip>
					</TooltipProvider>

					<ActionsCell
						original={data}
						onEdit={() => openFileEditDialog(data)}
						canEdit={canEditBucket}
						canDelete={canDeleteBucket}
					>
						<TableConfirmation
							align='end'
							title={translate('storage.file.delete.title')}
							description={translate('storage.file.delete.message')}
							onConfirm={() => deleteFileHandler(data)}
							contentClassName='m-0'
							hasPermission={canDeleteBucket}
						/>
					</ActionsCell>
				</div>
			);
		},
	},
];

export default FileColumns;
