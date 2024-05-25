import { useSaveLogicOnSuccess, useToast } from '@/hooks';
import useAuthorizeVersion from '@/hooks/useAuthorizeVersion';
import { VersionEditorLayout } from '@/layouts/VersionLayout';
import useMiddlewareStore from '@/store/middleware/middlewareStore.ts';
import { APIError } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { BreadCrumbItem } from 'components/BreadCrumb';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

export default function EditMiddleware() {
	const { toast } = useToast();
	const { middlewareId, orgId, appId, versionId } = useParams() as Record<string, string>;
	const canEdit = useAuthorizeVersion('middleware.update');
	const { saveMiddlewareLogic, openEditMiddlewareModal, middleware, logics, setLogics } =
		useMiddlewareStore();
	const { t } = useTranslation();
	const onSuccess = useSaveLogicOnSuccess(t('version.middleware.edit.success'));
	const { mutate, isPending } = useMutation({
		mutationKey: ['saveMiddlewareCode'],
		mutationFn: (logic: string) =>
			saveMiddlewareLogic({
				orgId,
				appId,
				versionId,
				middlewareId: useMiddlewareStore.getState().middleware._id,
				logic: logic,
			}),

		onSuccess,
		onError(error: APIError) {
			toast({
				title: error.details,
				action: 'error',
			});
		},
	});
	async function saveLogic(logic: string) {
		if (!logics[middlewareId] || !canEdit) return;
		mutate(logic);
	}
	function openEditDrawer() {
		openEditMiddlewareModal(middleware);
	}

	const url = `/organization/${orgId}/apps/${appId}/version/${versionId}/middleware`;
	const breadcrumbItems: BreadCrumbItem[] = [
		{
			name: t('version.middleware.default').toString(),
			url,
		},
		{
			name: middleware.name,
		},
	];

	return (
		<VersionEditorLayout
			className='p-0'
			breadCrumbItems={breadcrumbItems}
			onEditModalOpen={openEditDrawer}
			onSaveLogic={saveLogic}
			loading={isPending}
			name={middlewareId}
			canEdit={canEdit}
			logic={logics[middlewareId]}
			setLogic={(val) => setLogics(middlewareId, val)}
		/>
	);
}
