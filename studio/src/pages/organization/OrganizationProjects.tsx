import { ConfirmationModal } from '@/components/ConfirmationModal';
import { EmptyState } from '@/components/EmptyState';
import { InfoModal } from '@/components/InfoModal';
import { Loading } from '@/components/Loading';
import { ApplicationCard } from '@/features/application';
import ApplicationTable from '@/features/application/ApplicationTable/ApplicationTable';
import CreateProject from '@/features/projects/CreateProject';
import ProjectActions from '@/features/projects/ProjectActions';
import { useSearch } from '@/hooks';
import useProjectStore from '@/store/project/projectStore';
import { APIError } from '@/types';
import { Project } from '@/types/project';
import { cn } from '@/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks';
export default function OrganizationProjects() {
	const { toast } = useToast();
	const {
		projects,
		getProjects,
		deleteProject,
		toDeleteProject,
		closeDeleteModal,
		isDeleteModalOpen,
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

	const {
		mutateAsync: deleteMutate,
		isPending: deleteLoading,
		error: deleteError,
	} = useMutation({
		mutationFn: () => deleteProject(orgId, toDeleteProject?._id as string),
		onSuccess: closeDeleteModal,
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
								{filteredProjects.map((project: Project) => (
									<ApplicationCard<Project>
										key={project._id}
										data={project}
										onClick={onProjectClick}
										loading={loading}
										type={'project'}
									/>
								))}
							</div>
						) : (
							<ApplicationTable apps={filteredProjects} />
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
			<ConfirmationModal
				loading={deleteLoading}
				error={deleteError}
				title={t('project.delete.title')}
				alertTitle={t('project.delete.alert')}
				alertDescription={t('project.delete.description')}
				description={
					<Trans
						i18nKey='project.delete.confirmCode'
						values={{ confirmCode: toDeleteProject?.iid }}
						components={{
							confirmCode: <span className='font-bold text-default' />,
						}}
					/>
				}
				confirmCode={toDeleteProject?.iid as string}
				onConfirm={deleteMutate}
				isOpen={isDeleteModalOpen}
				closeModal={closeDeleteModal}
				closable
			/>
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
