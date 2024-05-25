import { ActionsCell } from '@/components/ActionsCell';
import { Badge } from '@/components/Badge';
import { TableConfirmation } from '@/components/Table';
import { TabLink } from '@/features/version/Tabs';
import { toast } from '@/hooks/useToast';
import useStorageStore from '@/store/storage/storageStore';
import { APIError, Bucket, FieldTypes, TabTypes } from '@/types';
import { DATE_TIME_FORMAT, convertUTC, getVersionPermission, translate } from '@/utils';
import { Prohibit } from '@phosphor-icons/react';
import { QueryClient } from '@tanstack/react-query';
import { ColDef, ICellRendererParams } from 'ag-grid-community';

const { emptyBucket, openDeleteBucketDialog, openEditBucketDialog } = useStorageStore.getState();

const queryClient = new QueryClient();
async function clearBucket(bucketName: string) {
	const { storage, bucket } = useStorageStore.getState();
	return queryClient
		.getMutationCache()
		.build(queryClient, {
			mutationFn: emptyBucket,
			onError: (error: APIError) => {
				toast({
					title: error.details,
					action: 'error',
				});
			},
		})
		.execute({
			storageName: storage?.name,
			bucketName,
			bckId: bucket.id,
			onSuccess: () => {
				toast({
					title: translate('storage.bucket.empty'),
					action: 'success',
				});
			},
			onError: ({ details }) => {
				toast({
					title: details,
					action: 'error',
				});
			},
		});
}

const BucketColumns: ColDef<Bucket>[] = [
	{
		checkboxSelection: true,
		headerCheckboxSelection: true,
		width: 50,
		pinned: 'left',
		resizable: true,
	},
	{
		field: 'name',
		cellRenderer: ({ value, data }: ICellRendererParams) => (
			<TabLink
				name={value}
				path={`bucket/${value}`}
				type={TabTypes.Bucket}
				onClick={() => {
					useStorageStore.setState({ bucket: data });
				}}
			/>
		),
		headerComponentParams: {
			type: FieldTypes.TEXT,
			label: translate('general.name'),
			field: 'name',
			filterable: true,
			entityId: useStorageStore.getState().storage._id,
		},
	},

	{
		field: 'isPublic',
		headerComponentParams: {
			type: FieldTypes.BOOLEAN,
			label: translate('storage.bucket.visibility.title'),
			field: 'isPublic',
			filterable: true,
			entityId: useStorageStore.getState().storage._id,
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
		field: 'tags',
		headerComponentParams: {
			label: translate('storage.bucket.tags'),
			field: 'tags',
			type: FieldTypes.TEXT,
			filterable: true,
			entityId: useStorageStore.getState().storage._id,
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
		field: 'createdAt',
		headerComponentParams: {
			label: translate('general.created_at'),
			field: 'createdAt',
			type: FieldTypes.DATETIME,
			filterable: true,
			entityId: useStorageStore.getState().storage._id,
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
			entityId: useStorageStore.getState().storage._id,
		},
		valueFormatter: ({ value }) => convertUTC(value, DATE_TIME_FORMAT),
	},
	{
		width: 150,
		pinned: 'right',
		cellRenderer: ({ data }: ICellRendererParams) => {
			const canEditBucket = getVersionPermission('storage.update');
			const canDeleteBucket = getVersionPermission('storage.delete');
			return (
				<div className='flex items-center justify-end'>
					<TableConfirmation
						align='end'
						title={translate('storage.clear.title')}
						description={translate('storage.clear.message')}
						onConfirm={() => clearBucket(data.name)}
						contentClassName='m-0'
						hasPermission={canDeleteBucket}
						tooltip='Clear bucket'
						icon={<Prohibit size={20} />}
					/>

					<ActionsCell
						original={data}
						onDelete={() => openDeleteBucketDialog(data)}
						onEdit={() => openEditBucketDialog(data)}
						canEdit={canEditBucket}
						canDelete={canDeleteBucket}
					/>
				</div>
			);
		},
	},
];

export default BucketColumns;
