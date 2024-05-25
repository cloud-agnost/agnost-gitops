import { ActionsCell } from '@/components/ActionsCell';
import { FIELD_ICON_MAP, FIELD_MAPPER } from '@/constants';
import { SubFields } from '@/features/database/models/fields/ListFields/index.ts';
import { toast } from '@/hooks/useToast';
import useModelStore from '@/store/database/modelStore.ts';
import useOrganizationStore from '@/store/organization/organizationStore';
import { APIError, ColumnDefWithClassName, Field } from '@/types';
import { getVersionPermission, toDisplayName, translate } from '@/utils';
import { QueryClient } from '@tanstack/react-query';
import { Badge } from 'components/Badge';
import { Checkbox } from 'components/Checkbox';
import { SortButton } from 'components/DataTable';
import { DateText } from 'components/DateText';
import { TableConfirmation } from 'components/Table';

const { openEditFieldDialog, deleteField } = useModelStore.getState();
const queryClient = new QueryClient();

async function deleteHandler(field: Field) {
	const model = useModelStore.getState().model;
	return queryClient
		.getMutationCache()
		.build(queryClient, {
			mutationFn: deleteField,
			onError: (error: APIError) => {
				toast({
					title: error.details,
					action: 'error',
				});
			},
		})
		.execute({
			dbId: model.dbId,
			appId: model.appId,
			orgId: model.orgId,
			modelId: model._id,
			fieldId: field._id,
			versionId: model.versionId,
		});
}
const FieldColumns: ColumnDefWithClassName<Field>[] = [
	{
		id: 'select',
		enableResizing: false,
		className: '!max-w-[35px] !w-[35px]',
		header: ({ table }) => {
			return (
				<Checkbox
					checked={table.getIsAllPageRowsSelected()}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label='Select all'
				/>
			);
		},
		cell: (props) => {
			const isSystem = props.row.original.creator === 'system';
			return (
				<Checkbox
					disabled={isSystem}
					checked={!isSystem && props.row.getIsSelected()}
					onCheckedChange={(value) => props.row.toggleSelected(!!value)}
					aria-label='Select row'
				/>
			);
		},
		meta: {
			disabled: [
				{
					key: 'creator',
					value: 'system',
				},
			],
		},
		enableSorting: false,
		enableHiding: false,
	},
	{
		id: 'name',
		header: () => <SortButton text={translate('general.field')} field='name' />,
		cell({ row: { original } }) {
			if (['object-list', 'object'].includes(original.type)) {
				return <SubFields field={original} name={original.name} />;
			}

			return original.name;
		},
		accessorKey: 'name',
		enableSorting: true,
		sortingFn: 'textCaseSensitive',
	},
	{
		id: 'type',
		header: () => <SortButton text={translate('general.type')} field='type' />,
		accessorKey: 'type',
		enableSorting: true,
		cell: ({
			row: {
				original: { type },
			},
		}) => {
			const Icon = FIELD_ICON_MAP[FIELD_MAPPER[type] ?? type];
			return (
				<span className='whitespace-nowrap flex items-center gap-1'>
					{Icon && <Icon className='w-5 h-5' />}
					{toDisplayName(FIELD_MAPPER[type] ?? type)}
				</span>
			);
		},
	},
	{
		id: 'unique',
		header: () => <SortButton text={translate('general.unique')} field='unique' />,
		accessorKey: 'unique',

		enableSorting: true,
		cell: ({
			row: {
				original: { unique },
			},
		}) => {
			return (
				<Badge
					rounded
					variant={unique ? 'green' : 'red'}
					text={unique ? translate('general.yes') : translate('general.no')}
				/>
			);
		},
	},
	{
		id: 'indexed',
		header: () => <SortButton text={translate('general.indexed')} field='indexed' />,
		accessorKey: 'indexed',
		enableSorting: true,
		cell: ({
			row: {
				original: { indexed },
			},
		}) => {
			return (
				<Badge
					rounded
					variant={indexed ? 'green' : 'red'}
					text={indexed ? translate('general.yes') : translate('general.no')}
				/>
			);
		},
	},
	{
		id: 'required',
		header: () => <SortButton text={translate('general.required')} field='required' />,
		accessorKey: 'required',
		enableSorting: true,
		cell: ({
			row: {
				original: { required },
			},
		}) => {
			return (
				<Badge
					rounded
					variant={required ? 'green' : 'red'}
					text={required ? translate('general.yes') : translate('general.no')}
				/>
			);
		},
	},
	{
		id: 'immutable',
		className: 'whitespace-nowrap',
		header: () => <SortButton text={translate('general.read-only')} field='immutable' />,
		accessorKey: 'immutable',
		enableSorting: true,
		cell: ({
			row: {
				original: { immutable },
			},
		}) => {
			return (
				<Badge
					rounded
					variant={immutable ? 'green' : 'red'}
					text={immutable ? translate('general.yes') : translate('general.no')}
				/>
			);
		},
	},
	{
		id: 'createdAt',
		header: () => (
			<SortButton
				className='whitespace-nowrap'
				text={translate('general.created_at')}
				field='createdAt'
			/>
		),
		accessorKey: 'createdAt',
		size: 200,
		enableSorting: true,
		cell: ({
			row: {
				original: { createdAt, createdBy },
			},
		}) => {
			const user = useOrganizationStore
				.getState()
				.members.find((member) => member.member._id === createdBy);

			return <DateText date={createdAt} user={user} />;
		},
	},

	{
		id: 'updatedAt',
		header: () => (
			<SortButton
				className='whitespace-nowrap'
				text={translate('general.updated_at')}
				field='updatedAt'
			/>
		),
		accessorKey: 'updatedAt',
		size: 200,
		enableSorting: true,
		cell: ({
			row: {
				original: { updatedAt, updatedBy },
			},
		}) => {
			const user = useOrganizationStore
				.getState()
				.members.find((member) => member.member._id === updatedBy);
			return updatedBy && <DateText date={updatedAt} user={user} />;
		},
	},

	{
		id: 'actions',
		className: 'actions !w-[50px]',
		cell: ({ row: { original } }) => {
			if (original.creator === 'system') return null;
			const canDelete = getVersionPermission('model.delete');
			const canEdit = getVersionPermission('model.update');
			return (
				<ActionsCell
					original={original}
					canEdit={canEdit}
					onEdit={() => openEditFieldDialog(original)}
				>
					<TableConfirmation
						align='end'
						title={translate('database.fields.delete.title')}
						description={translate('database.fields.delete.description')}
						onConfirm={() => deleteHandler(original)}
						contentClassName='m-0'
						hasPermission={canDelete}
					/>
				</ActionsCell>
			);
		},
	},
];

export default FieldColumns;
