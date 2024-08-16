import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { DataTable } from '@/components/DataTable';
import { DropdownMenuItemContainer } from '@/components/Dropdown';
import { EmptyState } from '@/components/EmptyState';
import { Github } from '@/components/icons';
import { Loading } from '@/components/Loading';
import { BADGE_COLOR_MAP } from '@/constants';
import { useTable, useUpdateEffect } from '@/hooks';
import useContainerStore from '@/store/container/containerStore';
import useEnvironmentStore from '@/store/environment/environmentStore';
import useOrganizationStore from '@/store/organization/organizationStore';
import useProjectStore from '@/store/project/projectStore';
import { ColumnDefWithClassName, ContainerPipeline } from '@/types';
import { cn, getRelativeTime, secondsToRelativeTime } from '@/utils';
import { DotsThreeVertical, GitBranch, GitCommit } from '@phosphor-icons/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from 'components/Dropdown';
import _, { startCase } from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import BuildLogs from './BuildLogs';

export default function Builds() {
	const { t } = useTranslation();
	const {
		getContainerPipelines,
		container,
		selectPipeline,
		selectedPipeline,
		containerPipelines: pipelines,
		triggerBuild,
	} = useContainerStore();
	const qc = useQueryClient();
	const { orgId, envId, projectId } = useParams() as Record<string, string>;
	const { isFetching } = useQuery<ContainerPipeline[]>({
		queryKey: ['containerPipelines', container?._id],
		queryFn: () =>
			getContainerPipelines({
				orgId,
				envId,
				projectId,
				containerId: container?._id!,
			}),
		refetchInterval: 3000,
	});
	const table = useTable<ContainerPipeline>({
		columns: PipelineColumns,
		data: pipelines || [],
	});

	const { mutate, isPending: triggerBuildLoading } = useMutation({
		mutationKey: ['triggerBuild'],
		mutationFn: triggerBuild,
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: ['containerPipelines', container?._id],
			});
		},
	});

	useUpdateEffect(() => {
		if (selectedPipeline) {
			selectPipeline(pipelines?.find((pipeline) => pipeline.name === selectedPipeline.name));
		}
	}, [pipelines]);

	if (isFetching && !pipelines) {
		return <Loading />;
	}

	if (!_.isNil(selectedPipeline)) {
		return <BuildLogs />;
	}
	if (pipelines?.length === 0) {
		return (
			<div className='w-full h-full'>
				<EmptyState title='You dont have any builds for this container' type='container'>
					<Button
						loading={triggerBuildLoading}
						className='btn btn-primary'
						onClick={() =>
							mutate({
								orgId,
								envId,
								projectId,
								containerId: container?._id!,
							})
						}
					>
						{t('container.trigger_build')}
					</Button>
				</EmptyState>
			</div>
		);
	}

	return (
		<div
			className={cn(
				'table-container overflow-auto',
				pipelines && pipelines.length > 10 && 'h-full',
			)}
		>
			<div className='h-full'>
				<DataTable
					table={table}
					className='navigator w-full h-full relative'
					headerClassName='sticky top-0 z-50'
					containerClassName='!border-none h-full'
					onRowClick={(row) => selectPipeline(row)}
				/>
			</div>
		</div>
	);
}

function reRun(pipelineName: string) {
	const { organization } = useOrganizationStore.getState();
	const { project } = useProjectStore.getState();
	const { environment } = useEnvironmentStore.getState();
	const { container, restartRun } = useContainerStore.getState();

	restartRun({
		containerId: container?._id!,
		orgId: organization?._id,
		projectId: project?._id,
		envId: environment?._id,
		pipelineName,
	});
}
function cancelRun(pipelineName: string) {
	const { organization } = useOrganizationStore.getState();
	const { project } = useProjectStore.getState();
	const { environment } = useEnvironmentStore.getState();
	const { container, cancelRun } = useContainerStore.getState();

	cancelRun({
		containerId: container?._id!,
		orgId: organization?._id,
		projectId: project?._id,
		envId: environment?._id,
		pipelineName,
	});
}
function deleteRun(pipelineName: string) {
	const { organization } = useOrganizationStore.getState();
	const { project } = useProjectStore.getState();
	const { environment } = useEnvironmentStore.getState();
	const { container, deleteRun } = useContainerStore.getState();

	deleteRun({
		containerId: container?._id!,
		orgId: organization?._id,
		projectId: project?._id,
		envId: environment?._id,
		pipelineName,
	});
}

const PipelineColumns: ColumnDefWithClassName<ContainerPipeline>[] = [
	{
		id: 'kind',
		header: 'Triggered By',
		accessorKey: 'GIT_COMMITTER_USERNAME',
		size: 200,
		cell: ({ row }) => (
			<div className='flex items-center gap-2'>
				<Github className='size-6' />
				<div className='space-y-1'>
					<Link
						to={`https://github.com/${row.original.GIT_COMMITTER_USERNAME}`}
						target='_blank'
						rel='noopener noreferrer'
						className='space-y-2 text-default hover:underline hover:text-elements-blue'
						onClick={(e) => e.stopPropagation()}
					>
						{row.original.GIT_COMMITTER_USERNAME}
					</Link>
					<p>{getRelativeTime(row.original.GIT_COMMIT_TIMESTAMP)}</p>
				</div>
			</div>
		),
	},
	{
		id: 'commit',
		header: 'Commit',
		accessorKey: 'GIT_COMMIT_MESSAGE',
		size: 300,
		cell: ({ row }) => (
			<div className='space-y-1'>
				<p className='truncate max-w-[20ch]'>{row.original.GIT_COMMIT_MESSAGE}</p>
				<div className='flex items-center gap-4'>
					<Link
						to={row.original.GIT_COMMIT_URL!}
						target='_blank'
						rel='noopener noreferrer'
						className='flex items-center gap-1 text-default hover:underline hover:text-elements-blue'
						onClick={(e) => e.stopPropagation()}
					>
						<GitCommit size={16} />
						<span>{row.original.GIT_COMMIT_ID}</span>
					</Link>
					<Link
						to={`${row.original?.GIT_REPO_URL}/tree/${row.original?.GIT_BRANCH}`}
						target='_blank'
						rel='noopener noreferrer'
						className='bg-elements-blue truncate text-xs px-1 rounded flex items-center gap-0.5 hover:underline text-gray-100'
						onClick={(e) => e.stopPropagation()}
					>
						<GitBranch size={10} />
						<span>{row.original?.GIT_BRANCH}</span>
					</Link>
				</div>
			</div>
		),
	},
	{
		id: 'status',
		header: 'Status',
		accessorKey: 'status',
		size: 100,
		cell: ({ row }) => {
			const badgeColor =
				row.original.status === 'Running'
					? 'blue'
					: BADGE_COLOR_MAP[row.original.status.toUpperCase()];
			return <Badge variant={badgeColor} text={startCase(row.original.status)} rounded />;
		},
	},
	{
		id: 'duration',
		header: 'Duration',
		accessorKey: 'duration',
		size: 200,
		cell: ({ row }) => secondsToRelativeTime(row.original.durationSeconds),
	},
	{
		id: 'actions',
		cell: ({ row }) => (
			<DropdownMenu>
				<DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
					<div className='size-7 hover:bg-wrapper-background-hover rounded-full flex items-center justify-center cursor-pointer'>
						<DotsThreeVertical className='size-5 text-icon-secondary' />
					</div>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItemContainer>
						<DropdownMenuItem
							onClick={() => useContainerStore.getState().selectPipeline(row.original)}
						>
							View Logs
						</DropdownMenuItem>
						<DropdownMenuItem
							disabled={row.original.status !== 'Running'}
							onClick={(e) => {
								e.stopPropagation();
								cancelRun(row.original.name);
							}}
						>
							Cancel Run
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={(e) => {
								e.stopPropagation();
								reRun(row.original.name);
							}}
						>
							Re-run
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={(e) => {
								e.stopPropagation();
								deleteRun(row.original.name);
							}}
						>
							Delete Run
						</DropdownMenuItem>
					</DropdownMenuItemContainer>
				</DropdownMenuContent>
			</DropdownMenu>
		),
	},
];
