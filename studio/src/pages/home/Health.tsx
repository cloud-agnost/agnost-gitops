import { useQuery } from '@tanstack/react-query';
import { ClusterService } from '@/services';
export default function Health() {
	const { data } = useQuery({
		queryKey: ['health'],
		queryFn: ClusterService.healthCheck,
	});

	return <div>{data}</div>;
}
