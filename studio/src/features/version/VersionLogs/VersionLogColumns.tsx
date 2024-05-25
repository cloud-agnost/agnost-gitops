import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { CopyButton } from '@/components/CopyButton';
import { SortButton } from '@/components/DataTable';
import { MethodBadge } from '@/components/Endpoint';
import { BADGE_COLOR_MAP, BASE_URL } from '@/constants';
import { DefaultFilter } from '@/features/database/models/Navigator';
import useEnvironmentStore from '@/store/environment/environmentStore';
import useVersionStore from '@/store/version/versionStore';
import { ColumnDefWithClassName, FieldTypes, VersionLog } from '@/types';
import { DATETIME_MED_WITH_SECONDS, capitalize, formatDate, translate } from '@/utils';
import { Calendar, Clock, Files } from '@phosphor-icons/react';
import DebugFilter from './DebugFilter';
import DurationFilter from './DurationFilter';
import FilterLayout from './FilterLayout';
import MethodFilter from './MethodFilter';
import StatusFilter from './StatusFilter';
import TimestampFilter from './TimestampFilter';

const { openVersionLogDetails } = useVersionStore.getState();
const env = useEnvironmentStore.getState().environment;
export const VersionLogColumns: ColumnDefWithClassName<VersionLog>[] = [
	{
		id: 'timestamp',
		header: () => (
			<SortButton text={translate('version.timestamp')} field='timestamp'>
				<TimestampFilter />
			</SortButton>
		),
		accessorKey: 'timestamp',
		cell: ({
			row: {
				original: { timestamp },
			},
		}) => {
			return (
				<div className='flex items-center gap-2'>
					<Calendar size={16} />
					<span className='whitespace-nowrap text-default'>
						{formatDate(timestamp, DATETIME_MED_WITH_SECONDS)}
					</span>
				</div>
			);
		},
	},
	{
		id: 'name',
		header: () => (
			<SortButton text={translate('general.name')} field='name'>
				<FilterLayout columnName='name'>
					<DefaultFilter
						type={FieldTypes.TEXT}
						columnName='name'
						entityId={window.location.pathname.split('/')[8]}
					/>
				</FilterLayout>
			</SortButton>
		),
		accessorKey: 'name',
	},

	{
		id: 'status',
		header: () => (
			<SortButton text={translate('general.status')} field='status'>
				<StatusFilter />
			</SortButton>
		),
		accessorKey: 'status',
		cell: ({
			row: {
				original: { status },
			},
		}) => {
			let statusText = status;
			if (typeof status !== 'string') {
				statusText = status >= 200 && status < 400 ? 'success' : 'error';
			}
			return (
				<Badge
					variant={BADGE_COLOR_MAP[statusText.toUpperCase()]}
					text={capitalize(statusText)}
					rounded
				/>
			);
		},
	},
	{
		id: 'duration',
		header: () => (
			<SortButton text={translate('version.response_time')} field='duration'>
				<DurationFilter />
			</SortButton>
		),
		accessorKey: 'duration',
		cell: ({
			row: {
				original: { duration },
			},
		}) => {
			return (
				<div className='flex items-center gap-2'>
					<Clock size={18} />
					<span className='whitespace-nowrap text-default'>{duration}ms</span>
				</div>
			);
		},
	},
	{
		id: 'debug',
		header: () => (
			<SortButton text={translate('version.debug')} field='response'>
				<DebugFilter />
			</SortButton>
		),

		accessorKey: 'debug',
		cell: ({
			row: {
				original: { debug },
			},
		}) => (
			<Badge
				variant={BADGE_COLOR_MAP[String(debug).toUpperCase()]}
				text={capitalize(String(debug))}
				rounded
			/>
		),
	},
	{
		id: 'action',
		cell: ({ row: { original } }) => {
			return (
				<Button variant='secondary' onClick={() => openVersionLogDetails(original)}>
					<Files className='mr-2' />
					{translate('version.view_log')}
				</Button>
			);
		},
	},
];
const EndpointColumns: ColumnDefWithClassName<VersionLog>[] = [
	{
		id: 'method',
		header: () => (
			<SortButton text={translate('endpoint.method')} field='method'>
				<MethodFilter />
			</SortButton>
		),
		accessorKey: 'method',
		cell: ({ row }) => {
			const { method } = row.original;
			return <MethodBadge method={method} />;
		},
	},
	{
		id: 'path',
		header: () => (
			<SortButton text={translate('endpoint.path')} field='path'>
				<FilterLayout columnName='path'>
					<DefaultFilter
						type={FieldTypes.TEXT}
						columnName='path'
						entityId={window.location.pathname.split('/')[8]}
					/>
				</FilterLayout>
			</SortButton>
		),
		accessorKey: 'path',
		cell: ({ row }) => {
			const { path } = row.original;
			const copyText = `${BASE_URL}/${env?.iid}${path}`;
			return (
				<div className='flex items-center gap-8 group'>
					<div className='truncate font-mono'>{path}</div>
					<CopyButton text={copyText} className='hidden group-hover:block' />
				</div>
			);
		},
	},
];
export const VersionEndpointLogColumns: ColumnDefWithClassName<VersionLog>[] = [
	...VersionLogColumns.slice(0, 2),
	...EndpointColumns,
	...VersionLogColumns.slice(2),
];
