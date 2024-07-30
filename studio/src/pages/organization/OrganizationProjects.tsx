import { DataTable } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { InfoModal } from '@/components/InfoModal';
import { Loading } from '@/components/Loading';
import CreateProject from '@/features/projects/CreateProject';
import ProjectActions from '@/features/projects/ProjectActions';
import ProjectCard from '@/features/projects/ProjectCard';
import { ProjectColumns } from '@/features/projects/ProjectColumns';
import { useSearch, useTable, useToast } from '@/hooks';
import useProjectStore from '@/store/project/projectStore';
import { APIError } from '@/types';
import { cn } from '@/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
export default function OrganizationProjects() {
	const { toast } = useToast();
	const {
		projects,
		getProjects,
		toDeleteProject,
		closeLeaveModal,
		isLeaveModalOpen,
		leaveProjectTeam,
		onProjectClick,
		loading,
	} = useProjectStore();
	const [isCard, setIsCard] = useState(true);

	const { orgId } = useParams() as Record<string, string>;
	const { t } = useTranslation();
	const filteredProjects = useSearch(projects);

	const { isFetching } = useQuery({
		queryKey: ['projects', orgId],
		queryFn: () => getProjects(orgId),
		enabled: projects[0]?.orgId !== orgId,
		refetchOnWindowFocus: false,
	});

	const { mutateAsync: leaveAppMutate, isPending: leaveLoading } = useMutation({
		mutationFn: () => leaveProjectTeam(orgId, toDeleteProject?._id as string),
		onSuccess: closeLeaveModal,
		onError: ({ details }: APIError) => {
			closeLeaveModal();
			toast({
				title: details,
				action: 'error',
			});
		},
	});

	const table = useTable({
		data: filteredProjects,
		columns: ProjectColumns,
	});
	return (
		<>
			<div
				className={cn(
					'scroll p-8',
					!projects.length && 'flex items-center justify-center relative',
				)}
			>
				{!!projects.length && !isFetching && (
					<>
						<ProjectActions isCard={isCard} setIsCard={setIsCard} />
						{isCard ? (
							<div
								className={cn(
									'mt-8 flex flex-wrap gap-6 items-center',
									!projects.length && 'h-3/4 justify-center',
								)}
							>
								{filteredProjects.map((project) => (
									<ProjectCard
										key={project._id}
										data={project}
										onClick={onProjectClick}
										loading={loading}
									/>
								))}
							</div>
						) : (
							<div className='my-8'>
								<DataTable table={table} />
							</div>
						)}
					</>
				)}
				<Loading loading={isFetching} />
				{!!projects.length && !filteredProjects.length && !isFetching && (
					<EmptyState title={t('project.search_empty')} type='project' />
				)}
				{!projects.length && !isFetching && (
					<EmptyState title={t('project.empty')} type='project'>
						<CreateProject />
					</EmptyState>
				)}
			</div>

			<InfoModal
				isOpen={isLeaveModalOpen}
				closeModal={closeLeaveModal}
				title={t('project.leave.title')}
				description={t('project.leave.description')}
				onConfirm={leaveAppMutate}
				loading={leaveLoading}
			/>
		</>
	);
}
