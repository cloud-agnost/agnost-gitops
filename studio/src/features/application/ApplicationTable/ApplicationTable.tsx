import { DataTable } from '@/components/DataTable';
import { Application } from '@/types';
import { ApplicationColumns } from './ApplicationColumns';
import { useTable } from '@/hooks';

interface ApplicationTableType {
	apps: Application[];
}

export default function ApplicationTable({ apps }: ApplicationTableType) {
	const table = useTable({
		data: apps,
		columns: ApplicationColumns,
	});
	return (
		<div className='my-8'>
			<DataTable table={table} />
		</div>
	);
}
