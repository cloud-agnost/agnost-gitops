import { DataTable } from '@/components/DataTable';
import useClusterStore from '@/store/cluster/clusterStore';
import { ClusterComponent } from '@/types';
import { useEffect } from 'react';
import ClusterComponentColumns from './ClusterComponentColumns';
import EditClusterComponent from './EditClusterComponent';
import { useTable } from '@/hooks';
export default function ClusterComponents() {
	const { clusterComponents, getClusterComponents } = useClusterStore();

	useEffect(() => {
		getClusterComponents();
	}, []);

	const table = useTable({
		data: clusterComponents,
		columns: ClusterComponentColumns,
	});
	return (
		<>
			<DataTable<ClusterComponent> table={table} className='table-fixed' />
			<EditClusterComponent />
		</>
	);
}
