import { DateText } from '@/components/DateText';
import { ClusterReleaseHistory } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';

const ReleaseHistoryColumns: ColumnDef<ClusterReleaseHistory>[] = [
	{
		id: 'release',
		accessorKey: 'release',
		header: () => <span>{t('cluster.release')}</span>,
	},
	{
		id: 'latest',
		accessorKey: 'latest',
		header: () => <span>{t('cluster.deployed_at')}</span>,
		cell: ({ row }) => <DateText date={row.original.timestamp} />,
	},
];

export default ReleaseHistoryColumns;
