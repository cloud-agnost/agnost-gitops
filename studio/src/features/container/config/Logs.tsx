import { Badge } from '@/components/Badge';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/components/Dropdown';
import { LogViewer } from '@/components/LogViewer';
import { BADGE_COLOR_MAP } from '@/constants';
import useContainerStore from '@/store/container/containerStore';
import { CaretDown, Check } from '@phosphor-icons/react';
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
				<DropdownMenu modal>
					<DropdownMenuTrigger className='select !bg-input-background w-full flex items-center'>
						<div className='flex justify-between w-full mr-4'>
							<p>{selectedPod?.name}</p>
							<Badge
								className='ml-4'
								variant={BADGE_COLOR_MAP[selectedPod?.status.toUpperCase() ?? 'DEFAULT']}
								text={selectedPod?.status!}
								rounded
							/>
						</div>
						<CaretDown className='h-4 w-4' />
					</DropdownMenuTrigger>
					<DropdownMenuContent className='w-[44rem] !bg-input-background'>
						{containerLogs?.pods?.map((pod) => (
							<DropdownMenuCheckboxItem
								key={pod.name}
								onSelect={() => onSelect(pod.name)}
								className='justify-between'
							>
								{pod.name}
								<div className='flex items-center gap-4'>
									<Badge
										className='ml-4'
										variant={BADGE_COLOR_MAP[pod?.status.toUpperCase() ?? 'DEFAULT']}
										text={pod?.status!}
										rounded
									/>
									<div className='size-4'>
										{selectedPod?.name === pod.name && <Check className='h-4 w-4' />}
									</div>
								</div>
							</DropdownMenuCheckboxItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
				// <Select value={selectedPod?.name} onValueChange={onSelect}>
				// 	<SelectTrigger className='w-full'>
				// 		<div className='flex justify-between w-full mr-4'>
				// 			<SelectValue>{selectedPod?.name}</SelectValue>
				// 			<Badge
				// 				className='ml-4'
				// 				variant={BADGE_COLOR_MAP[selectedPod?.status.toUpperCase() ?? 'DEFAULT']}
				// 				text={selectedPod?.status!}
				// 				rounded
				// 			/>
				// 		</div>
				// 	</SelectTrigger>

				// 	<SelectContent>
				// 		{containerLogs?.pods?.map((pod) => (
				// 			<SelectItem key={pod.name} value={pod.name}>
				// 				<div className='w-full flex items-center justify-between flex-1'>
				// 					{pod.name}
				// 					<Badge
				// 						className='ml-4'
				// 						variant={BADGE_COLOR_MAP[pod?.status.toUpperCase() ?? 'DEFAULT']}
				// 						text={pod?.status!}
				// 						rounded
				// 					/>
				// 				</div>
				// 			</SelectItem>
				// 		))}
				// 	</SelectContent>
				// </Select>
			)}
			<LogViewer className='flex-1' logs={selectedLogs?.logs ?? ['No pods available']} />
		</div>
	);
}
