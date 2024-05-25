import { Button } from '@/components/Button';
import { LogViewer } from '@/components/LogViewer';
import useContainerStore from '@/store/container/containerStore';
import { ContainerPipelineLogStatus, ContainerPipelineLogs } from '@/types/container';
import { cn } from '@/utils';
import {
	ArrowLeft,
	CaretRight,
	CheckCircle,
	CircleNotch,
	Prohibit,
	WarningCircle,
} from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { startCase } from 'lodash';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
export default function BuildLogs() {
	const { t } = useTranslation();

	const { getContainerPipelineLogs, container, selectPipeline, selectedPipeline } =
		useContainerStore();
	const { orgId, envId, projectId } = useParams() as Record<string, string>;
	const [selectedStep, setSelectedStep] = useState('setup');
	const [logs, setLogs] = useState<string[]>([]);
	const { data: pipelineLogs } = useQuery<ContainerPipelineLogs[]>({
		queryKey: ['containerPipelineLogs'],
		queryFn: () =>
			getContainerPipelineLogs({
				orgId,
				envId,
				projectId,
				containerId: container?._id!,
				pipelineName: selectedPipeline?.name!,
			}),
		refetchInterval: 3000,
	});

	const selectedLog = useMemo(() => {
		const step = pipelineLogs?.find((log) => log.step === selectedStep);
		setLogs(step?.logs ?? []);
		return step;
	}, [pipelineLogs, selectedStep]);

	function getStatusText(status: ContainerPipelineLogStatus) {
		switch (status) {
			case 'success':
				return 'Step completed successfully';
			case 'error':
				return 'Step failed';
			case 'running':
				return 'Step running';
			case 'pending':
				return 'Step waiting previous step completion';
		}
	}

	return (
		<div className='space-y-4 h-full flex flex-col'>
			<div>
				<Button variant='text' className='gap-4 hover:underline' onClick={() => selectPipeline()}>
					<ArrowLeft />
					{t('container.pipeline.back')}
				</Button>
			</div>
			<h2 className='font-sfCompact'>{selectedPipeline?.name}</h2>
			<div className='flex items-center gap-4'>
				{pipelineLogs?.map((log, index) => (
					<div key={log.step} className='flex items-center justify-start gap-2'>
						<Button
							variant='text'
							className={cn('gap-2', selectedStep === log.step && ' bg-wrapper-background-hover')}
							onClick={() => setSelectedStep(log.step)}
						>
							{log?.status === 'success' && (
								<CheckCircle size={16} className='text-elements-green' />
							)}
							{log?.status === 'error' && <WarningCircle size={16} className='text-elements-red' />}
							{log?.status === 'running' && <CircleNotch size={16} className='animate-spin' />}
							{log?.status === 'pending' && <Prohibit size={16} />}
							{startCase(log.step)}
						</Button>

						{index < pipelineLogs.length - 1 && <CaretRight size={16} />}
					</div>
				))}
			</div>
			<LogViewer logs={logs} className='flex-1' />
			<p
				className={cn(
					'font-sfCompact text-xs',
					selectedLog?.status === 'success' && 'text-elements-green',
					selectedLog?.status === 'error' && 'text-elements-red',
				)}
			>
				{getStatusText(selectedLog?.status!)}
			</p>
		</div>
	);
}
