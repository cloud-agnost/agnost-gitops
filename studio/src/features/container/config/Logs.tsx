import { Badge } from '@/components/Badge';
import { LogViewer } from '@/components/LogViewer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import { BADGE_COLOR_MAP } from '@/constants';
import useContainerStore from '@/store/container/containerStore';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

export default function Logs() {
	const { getContainerLogs, container, selectedPod, setSelectedPod, containerLogs } =
		useContainerStore();
	const { orgId, envId, projectId } = useParams() as Record<string, string>;
	const [searchParams] = useSearchParams();
	useQuery({
		queryKey: ['containerLogs', searchParams.get('t')],
		queryFn: () =>
			getContainerLogs({
				orgId,
				envId,
				projectId,
				containerId: container?._id!,
			}),
		refetchInterval: 3000,
	});

	function onSelect(podName: string) {
		if (!containerLogs?.pods) return;
		setSelectedPod(containerLogs.pods.find((pod) => pod.name === podName) ?? containerLogs.pods[0]);
	}

	const selectedLogs = useMemo(() => {
		return containerLogs?.logs.find((log) => log.podName === selectedPod?.name);
	}, [selectedPod, containerLogs]);

	useEffect(() => {
		if (
			containerLogs?.pods &&
			!containerLogs?.pods?.some((pod) => pod.name === selectedPod?.name)
		) {
			setSelectedPod(containerLogs.pods[0]);
		}
	}, [containerLogs?.pods]);

	return (
		<div className='h-full space-y-4 flex flex-col'>
			{!!containerLogs?.pods.length && (
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
						{containerLogs?.pods?.map((pod) => (
							<SelectItem key={pod.name} value={pod.name}>
								{pod.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
			<LogViewer className='flex-1' logs={selectedLogs?.logs ?? ['No pods available']} />
		</div>
	);
}
