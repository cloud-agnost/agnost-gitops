import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { DataTable } from '@/components/DataTable';
import { Github } from '@/components/icons';
import { BADGE_COLOR_MAP } from '@/constants';
import { useTable, useUpdateEffect } from '@/hooks';
import useContainerStore from '@/store/container/containerStore';
import { ColumnDefWithClassName } from '@/types';
import { ContainerPipeline } from '@/types/container';
import { cn, getRelativeTime, secondsToRelativeTime } from '@/utils';
import { GitBranch, GitCommit } from '@phosphor-icons/react';
import { File } from '@phosphor-icons/react/dist/ssr';
import { useQuery } from '@tanstack/react-query';
import _, { startCase } from 'lodash';
import { Link, useParams } from 'react-router-dom';
import BuildLogs from './BuildLogs';

export default function Builds() {
	const { getContainerPipelines, container, selectPipeline, selectedPipeline } =
		useContainerStore();
	console.log('selectedPipeline', selectedPipeline);
	const { orgId, envId, projectId } = useParams() as Record<string, string>;
	const { data: pipelines } = useQuery<ContainerPipeline[]>({
		queryKey: ['containerPipelines'],
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

	useUpdateEffect(() => {
		if (selectedPipeline) {
			selectPipeline(pipelines?.find((pipeline) => pipeline.name === selectedPipeline.name));
		}
	}, [pipelines]);

	if (!_.isNil(selectedPipeline)) {
		return <BuildLogs />;
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
				/>
			</div>
		</div>
	);
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
			<div>
				<p>{row.original.GIT_COMMIT_MESSAGE}</p>
				<div className='flex items-center gap-4'>
					<Link
						to={row.original.GIT_COMMIT_URL!}
						target='_blank'
						rel='noopener noreferrer'
						className='flex items-center gap-1 text-default hover:underline hover:text-elements-blue'
					>
						<GitCommit size={16} />
						<span>{row.original.GIT_COMMIT_ID}</span>
					</Link>
					<Link
						to={`${row.original?.GIT_REPO_URL}/tree/${row.original?.GIT_BRANCH}`}
						target='_blank'
						rel='noopener noreferrer'
						className='bg-elements-blue truncate text-xs px-1 rounded flex items-center gap-0.5 hover:underline text-gray-100'
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
		cell: ({ row }) => (
			<Badge
				variant={BADGE_COLOR_MAP[row.original.status.toUpperCase()]}
				text={startCase(row.original.status)}
				rounded
			/>
		),
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
			<Button
				variant='text'
				className='gap-2'
				onClick={() => useContainerStore.getState().selectPipeline(row.original)}
			>
				<File size={16} />
				Logs
			</Button>
		),
	},
];
