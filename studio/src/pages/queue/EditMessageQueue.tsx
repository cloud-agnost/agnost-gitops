import TestMessageQueue from '@/features/queue/TestMessageQueue';
import { useSaveLogicOnSuccess, useToast } from '@/hooks';
import useAuthorizeVersion from '@/hooks/useAuthorizeVersion';
import { VersionEditorLayout } from '@/layouts/VersionLayout';
import useMessageQueueStore from '@/store/queue/messageQueueStore';
import { APIError } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

export default function EditMessageQueue() {
	const { t } = useTranslation();
	const { toast } = useToast();
	const canEdit = useAuthorizeVersion('queue.update');
	const { saveQueueLogic, queue, openEditQueueModal, setLogics, logics } = useMessageQueueStore();
	const [isTestQueueOpen, setIsTestQueueOpen] = useState(false);

	const { versionId, appId, orgId } = useParams<{
		versionId: string;
		appId: string;
		orgId: string;
		queueId: string;
	}>();
	const onSuccess = useSaveLogicOnSuccess(t('queue.editLogicSuccess'));
	const { mutateAsync: updateQueueCode, isPending } = useMutation({
		mutationFn: (logic: string) =>
			saveQueueLogic({
				orgId: orgId as string,
				appId: appId as string,
				versionId: versionId as string,
				queueId: useMessageQueueStore.getState().queue._id as string,
				logic: logic,
			}),
		mutationKey: ['updateQueueLogic'],
		onSuccess,
		onError: ({ details }: APIError) => {
			toast({
				title: details,
				action: 'error',
			});
		},
	});

	return (
		<VersionEditorLayout
			onEditModalOpen={() => openEditQueueModal(queue)}
			onTestModalOpen={() => setIsTestQueueOpen(true)}
			onSaveLogic={updateQueueCode}
			loading={isPending}
			name={queue._id}
			canEdit={canEdit}
			logic={logics[queue._id]}
			setLogic={(val) => setLogics(queue._id, val)}
			breadCrumbItems={[
				{
					name: t('queue.title').toString(),
					url: `/organization/${orgId}/apps/${appId}/version/${versionId}/queue`,
				},
				{
					name: queue?.name,
				},
			]}
		>
			<TestMessageQueue open={isTestQueueOpen} onClose={() => setIsTestQueueOpen(false)} />
		</VersionEditorLayout>
	);
}
