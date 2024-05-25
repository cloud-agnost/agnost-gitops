import { Separator } from '@/components/Separator';
import { TestTask } from '@/features/task';
import { useSaveLogicOnSuccess, useToast } from '@/hooks';
import useAuthorizeVersion from '@/hooks/useAuthorizeVersion';
import { VersionEditorLayout } from '@/layouts/VersionLayout';
import useTaskStore from '@/store/task/taskStore';
import { APIError } from '@/types';
import { describeCronExpression } from '@/utils';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

export default function EditTask() {
	const { t } = useTranslation();
	const { toast } = useToast();
	const canEdit = useAuthorizeVersion('task.update');
	const { task, saveTaskLogic, openEditTaskModal, logics, setLogics } = useTaskStore();
	const [isTestTaskOpen, setIsTestTaskOpen] = useState(false);
	const { versionId, appId, orgId } = useParams<{
		versionId: string;
		appId: string;
		orgId: string;
		taskId: string;
	}>();
	const onSuccess = useSaveLogicOnSuccess(t('task.editLogicSuccess'));
	const { mutateAsync: saveTaskCode, isPending } = useMutation({
		mutationFn: saveTaskLogic,
		mutationKey: ['saveLogic'],
		onSuccess,
		onError: ({ details }: APIError) => {
			toast({
				title: details,
				action: 'error',
			});
		},
	});

	function saveLogic(logic: string) {
		saveTaskCode({
			orgId: orgId as string,
			appId: appId as string,
			versionId: versionId as string,
			taskId: useTaskStore.getState().task._id,
			logic: logic,
		});
	}

	return (
		<VersionEditorLayout
			onEditModalOpen={() => openEditTaskModal(task)}
			onTestModalOpen={() => setIsTestTaskOpen(true)}
			onSaveLogic={saveLogic}
			loading={isPending}
			name={task._id}
			canEdit={canEdit}
			logic={logics[task._id]}
			setLogic={(val) => setLogics(task._id, val)}
			breadCrumbItems={[
				{
					name: t('task.title').toString(),
					url: `/organization/${orgId}/apps/${appId}/version/${versionId}/task`,
				},
				{
					name: task?.name,
				},
			]}
		>
			<div className='flex items-center gap-4 flex-1'>
				<Separator orientation='vertical' className='h-[24px] w-[1px]' />
				<span className='text-default font-sfCompact text-xs'>
					{describeCronExpression(task.cronExpression)}
				</span>
			</div>
			<TestTask open={isTestTaskOpen} onClose={() => setIsTestTaskOpen(false)} />
		</VersionEditorLayout>
	);
}
