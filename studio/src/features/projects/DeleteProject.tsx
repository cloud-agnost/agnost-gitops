import { ConfirmationModal } from '@/components/ConfirmationModal';
import useProjectStore from '@/store/project/projectStore';
import { useMutation } from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
export default function DeleteProject() {
	const { t } = useTranslation();
	const { orgId } = useParams() as Record<string, string>;
	const { deleteProject, toDeleteProject, closeDeleteModal, isDeleteModalOpen } = useProjectStore();
	const {
		mutateAsync: deleteMutate,
		isPending: deleteLoading,
		error: deleteError,
	} = useMutation({
		mutationFn: () => deleteProject(orgId, toDeleteProject?._id as string),
		onSuccess: closeDeleteModal,
	});
	return (
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
	);
}
