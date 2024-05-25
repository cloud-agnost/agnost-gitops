import { ActionsCell } from '@/components/ActionsCell';
import { Badge } from '@/components/Badge';
import { Checkbox } from '@/components/Checkbox';
import { CopyButton } from '@/components/CopyButton';
import { SortButton } from '@/components/DataTable';
import { DateText } from '@/components/DateText';
import { MethodBadge } from '@/components/Endpoint';
import { TableConfirmation } from '@/components/Table';
import { BADGE_COLOR_MAP, BASE_URL } from '@/constants';
import { toast } from '@/hooks/useToast';
import useEndpointStore from '@/store/endpoint/endpointStore';
import useEnvironmentStore from '@/store/environment/environmentStore';
import useOrganizationStore from '@/store/organization/organizationStore';
import { APIError, ColumnDefWithClassName, Endpoint, TabTypes } from '@/types';
import { getVersionPermission, translate } from '@/utils';
import { QueryClient } from '@tanstack/react-query';
import { TabLink } from '../version/Tabs';

const queryClient = new QueryClient();
const env = useEnvironmentStore.getState().environment;
const { openEditEndpointModal, deleteEndpoint } = useEndpointStore.getState();
async function deleteEndpointHandler(toDeleteEndpoint: Endpoint) {
	return queryClient
		.getMutationCache()
		.build(queryClient, {
			mutationFn: deleteEndpoint,
			onError: (error: APIError) => {
				toast({
					title: error.details,
					action: 'error',
				});
			},
		})
		.execute({
			appId: toDeleteEndpoint.appId,
			orgId: toDeleteEndpoint.orgId,
			versionId: toDeleteEndpoint.versionId,
			endpointId: toDeleteEndpoint._id,
		});
}

const EndpointColumns: ColumnDefWithClassName<Endpoint>[] = [
	{
		id: 'select',
		enableResizing: false,
		className: '!max-w-[35px] !w-[35px]',
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected()}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label='Select all'
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label='Select row'
			/>
		),
		enableSorting: false,
		enableHiding: false,
		size: 40,
	},
	{
		id: 'name',
		header: () => <SortButton text={translate('general.name')} field='name' />,
		accessorKey: 'name',
		sortingFn: 'textCaseSensitive',
		enableSorting: true,
		cell: ({ row }) => {
			const { name, _id } = row.original;
			return <TabLink name={name} path={`${_id}`} type={TabTypes.Endpoint} />;
		},
	},
	{
		id: 'method',
		header: () => <SortButton text={translate('endpoint.method')} field='method' />,
		accessorKey: 'method',
		size: 100,
		enableSorting: true,
		cell: ({ row }) => {
			const { method } = row.original;
			return <MethodBadge method={method} />;
		},
	},
	{
		id: 'path',
		header: () => <SortButton text={translate('endpoint.path')} field='path' />,
		accessorKey: 'path',
		size: 200,
		enableSorting: true,
		cell: ({ row }) => {
			const { path } = row.original;
			const copyText = `${BASE_URL}/${env?.iid}${path}`;
			return (
				<div className='flex items-center gap-4 group'>
					<div className='truncate font-mono'>{path}</div>
					<CopyButton text={copyText} className='hidden group-hover:block' />
				</div>
			);
		},
	},
	{
		id: 'API KEY',
		accessorKey: 'apiKeyRequired',
		header: () => <SortButton text={translate('endpoint.apiKey')} field='apiKeyRequired' />,
		size: 200,
		enableSorting: true,
		cell: ({ row }) => {
			const { apiKeyRequired } = row.original;
			const apiKeyRequiredText = apiKeyRequired
				? translate('endpoint.required')
				: translate('endpoint.optional');
			return (
				<Badge
					variant={BADGE_COLOR_MAP[apiKeyRequiredText.toUpperCase()]}
					text={apiKeyRequiredText}
					rounded
				/>
			);
		},
	},
	{
		id: 'session',
		header: () => <SortButton text={translate('endpoint.session')} field='sessionRequired' />,
		enableSorting: true,
		size: 200,
		cell: ({ row }) => {
			const { sessionRequired } = row.original;
			const sessionRequiredText = sessionRequired
				? translate('endpoint.required')
				: translate('endpoint.optional');
			return (
				<Badge
					variant={BADGE_COLOR_MAP[sessionRequiredText.toUpperCase()]}
					text={sessionRequiredText}
					rounded
				/>
			);
		},
	},
	{
		id: 'createdAt',
		header: () => <SortButton text={translate('general.created_at')} field='createdAt' />,
		accessorKey: 'createdAt',
		enableSorting: true,
		size: 200,
		cell: ({ row }) => {
			const { createdAt, createdBy } = row.original;
			const user = useOrganizationStore
				.getState()
				.members.find((member) => member.member._id === createdBy);

			return <DateText date={createdAt} user={user} />;
		},
	},

	{
		id: 'updatedAt',
		header: () => <SortButton text={translate('general.updated_at')} field='updatedAt' />,
		accessorKey: 'updatedAt',
		enableSorting: true,
		size: 200,
		cell: ({ row }) => {
			const { updatedAt, updatedBy } = row.original;
			const user = useOrganizationStore
				.getState()
				.members.find((member) => member.member._id === updatedBy);
			return updatedBy && <DateText date={updatedAt} user={user} />;
		},
	},
	{
		id: 'actions',
		className: 'actions',
		size: 145,
		enableSorting: true,
		cell: ({ row }) => {
			const canEditEndpoint = getVersionPermission('endpoint.update');
			const canDeleteEndpoint = getVersionPermission('endpoint.delete');
			return (
				<ActionsCell<Endpoint>
					original={row.original}
					canEdit={canEditEndpoint}
					onEdit={() => openEditEndpointModal(row.original)}
				>
					<TableConfirmation
						align='end'
						title={translate('endpoint.delete.title')}
						description={translate('endpoint.delete.message')}
						onConfirm={() => deleteEndpointHandler(row.original)}
						contentClassName='m-0'
						hasPermission={canDeleteEndpoint}
					/>
				</ActionsCell>
			);
		},
	},
];

export default EndpointColumns;
