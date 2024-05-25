import { DataTable } from '@/components/DataTable';
import useEnvironmentStore from '@/store/environment/environmentStore.ts';
import { EnvironmentResourcesColumn } from './EnvironmentResourcesColumn';
import { useTable } from '@/hooks';
export default function EnvironmentResourcesTable() {
	const resources = useEnvironmentStore((state) => state.resources);
	const table = useTable({
		data: resources,
		columns: EnvironmentResourcesColumn,
	});
	return <DataTable table={table} />;
}
