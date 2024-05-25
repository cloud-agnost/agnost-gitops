import { ConfirmationModal } from '@/components/ConfirmationModal';
import useContainerStore from '@/store/container/containerStore';
import { useMutation } from '@tanstack/react-query';
import { startCase } from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

export default function DeleteContainer() {
	const { t } = useTranslation();
	const {
		isDeleteContainerDialogOpen,
		toDeleteContainer,
		deleteContainer,
		closeDeleteContainerDialog,
	} = useContainerStore();
	const { orgId, projectId, envId } = useParams() as Record<string, string>;

	const { mutate, isPending, error, reset } = useMutation({
		mutationFn: () =>
			deleteContainer({ orgId, projectId, envId, containerId: toDeleteContainer?._id! }),
		onSuccess: onClose,
	});

	function onClose() {
		reset();
		closeDeleteContainerDialog();
	}
	return (
		<ConfirmationModal
			loading={isPending}
			error={error}
			title={t('container.delete.title', { type: startCase(toDeleteContainer?.type) })}
			alertTitle={t('container.delete.alert', { type: toDeleteContainer?.type })}
			alertDescription={t('container.delete.description', {
				type: toDeleteContainer?.type,
			})}
			description={
				<Trans
					i18nKey='container.delete.confirm'
					values={{ confirmCode: toDeleteContainer?.iid }}
					components={{
						confirmCode: <span className='font-bold text-default' />,
					}}
				/>
			}
			confirmCode={toDeleteContainer?.iid!}
			onConfirm={mutate}
			isOpen={isDeleteContainerDialogOpen}
			closeModal={onClose}
			closable
		/>
	);
}
