import { Badge } from '@/components/Badge';
import { LogViewer } from '@/components/LogViewer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import { BADGE_COLOR_MAP } from '@/constants';
import useContainerStore from '@/store/container/containerStore';
import { ContainerPod } from '@/types/container';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function Logs() {
	const { getContainerLogs, container } = useContainerStore();
	const { orgId, envId, projectId } = useParams() as Record<string, string>;

	const { data } = useQuery({
		queryKey: ['containerLogs'],
		queryFn: () =>
			getContainerLogs({
				orgId,
				envId,
				projectId,
				containerId: container?._id!,
			}),
		refetchInterval: 3000,
	});
	const [selectedPod, setSelectedPod] = useState<ContainerPod | undefined>(data?.pods[0]);

	function onSelect(podName: string) {
		if (!data?.pods) return;
		setSelectedPod(data.pods.find((pod) => pod.name === podName));
	}

	const selectedLogs = useMemo(() => {
		return data?.logs.find((log) => log.podName === selectedPod?.name);
	}, [selectedPod, data]);

	useEffect(() => {
		if (data?.pods && !selectedPod) {
			setSelectedPod(data.pods[0]);
		}
	}, [data]);

	return (
		<div className='h-full space-y-4 flex flex-col'>
			<Select value={selectedPod?.name} onValueChange={onSelect}>
				<SelectTrigger className='w-full'>
					<div className='flex justify-between w-full mr-4'>
						<SelectValue />
						<Badge
							className='ml-4'
							variant={BADGE_COLOR_MAP[selectedPod?.status.toUpperCase() ?? 'DEFAULT']}
							text={selectedPod?.status!}
							rounded
						/>
					</div>
				</SelectTrigger>

				<SelectContent>
					{data?.pods?.map((pod) => (
						<SelectItem key={pod.name} value={pod.name}>
							{pod.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<LogViewer className='flex-1' logs={selectedLogs?.logs ?? []} />
		</div>
	);
}
