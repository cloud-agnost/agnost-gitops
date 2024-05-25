import { useSaveLogicOnSuccess, useToast } from '@/hooks';
import useAuthorizeVersion from '@/hooks/useAuthorizeVersion';
import { VersionEditorLayout } from '@/layouts/VersionLayout';
import useFunctionStore from '@/store/function/functionStore';
import { APIError } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

export default function EditFunction() {
	const { t } = useTranslation();
	const { toast } = useToast();
	const canEdit = useAuthorizeVersion('function.update');
	const {
		function: helper,
		saveFunctionLogic,
		openEditFunctionModal,
		logics,
		setLogics,
	} = useFunctionStore();

	const { versionId, appId, orgId } = useParams<{
		versionId: string;
		appId: string;
		orgId: string;
		funcId: string;
	}>();
	const onSuccess = useSaveLogicOnSuccess(t('function.editLogicSuccess'));
	const { mutate: saveFunctionCodeMutation, isPending } = useMutation({
		mutationFn: (logic: string) =>
			saveFunctionLogic({
				orgId: orgId as string,
				appId: appId as string,
				versionId: versionId as string,
				functionId: useFunctionStore.getState().function._id as string,
				logic: logic,
			}),
		onSuccess,
		onError: (error: APIError) => {
			toast({
				title: error.details,
				action: 'error',
			});
		},
	});

	return (
		<VersionEditorLayout
			onEditModalOpen={() => openEditFunctionModal(helper)}
			onSaveLogic={saveFunctionCodeMutation}
			loading={isPending}
			name={helper._id}
			logic={logics[helper._id]}
			setLogic={(val) => setLogics(helper._id, val)}
			breadCrumbItems={[
				{
					name: t('function.title').toString(),
					url: `/organization/${orgId}/apps/${appId}/version/${versionId}/function`,
				},
				{
					name: helper?.name,
				},
			]}
			canEdit={canEdit}
		/>
	);
}
