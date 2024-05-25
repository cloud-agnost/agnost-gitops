import { DataTable } from '@/components/DataTable';
import useVersionStore from '@/store/version/versionStore';
import { VersionTableColumns } from './VersionTableColumns';
import { useTable } from '@/hooks';

export default function VersionTable() {
	const { versions } = useVersionStore();
	const table = useTable({
		data: versions,
		columns: VersionTableColumns,
	});
	return <DataTable table={table} />;
}
