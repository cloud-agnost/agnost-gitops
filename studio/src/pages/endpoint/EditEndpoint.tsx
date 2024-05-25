import { Badge } from '@/components/Badge';
import { CopyButton } from '@/components/CopyButton';
import { Input } from '@/components/Input';
import { BASE_URL, HTTP_METHOD_BADGE_MAP } from '@/constants';
import TestEndpoint from '@/features/endpoints/TestEndpoint';
import { useSaveLogicOnSuccess, useToast } from '@/hooks';
import useAuthorizeVersion from '@/hooks/useAuthorizeVersion';
import { VersionEditorLayout } from '@/layouts/VersionLayout';
import useEndpointStore from '@/store/endpoint/endpointStore';
import useEnvironmentStore from '@/store/environment/environmentStore';
import { APIError } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';

export default function EditEndpoint() {
	const { t } = useTranslation();
	const { toast } = useToast();
	const canEdit = useAuthorizeVersion('endpoint.update');
	const environment = useEnvironmentStore((state) => state.environment);
	const { saveEndpointLogic, openEditEndpointModal, endpoint, logics, setLogics } =
		useEndpointStore();

	const [searchParams, setSearchParams] = useSearchParams();
	const [isTestEndpointOpen, setIsTestEndpointOpen] = useState(false);
	const { versionId, appId, orgId } = useParams<{
		versionId: string;
		appId: string;
		orgId: string;
		endpointId: string;
	}>();
	const onSuccess = useSaveLogicOnSuccess(t('endpoint.editLogicSuccess'));
	const { mutateAsync: saveEpMutation, isPending } = useMutation({
		mutationFn: (logic: string) =>
			saveEndpointLogic({
				orgId: orgId as string,
				appId: appId as string,
				versionId: versionId as string,
				endpointId: useEndpointStore.getState().endpoint._id,
				logic: logic,
			}),
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
			onEditModalOpen={() => openEditEndpointModal(endpoint)}
			onTestModalOpen={() => setIsTestEndpointOpen(true)}
			onSaveLogic={saveEpMutation}
			loading={isPending}
			name={endpoint?._id}
			canEdit={canEdit}
			logic={logics[endpoint._id]}
			setLogic={(val) => setLogics(endpoint._id, val)}
			breadCrumbItems={[
				{
					name: t('endpoint.title').toString(),
					url: `/organization/${orgId}/apps/${appId}/version/${versionId}/endpoint`,
				},
				{
					name: endpoint?.name,
				},
			]}
		>
			<div className='flex items-center flex-1'>
				<div className='w-16 h-7'>
					<Badge
						className='w-full h-full rounded-none rounded-l'
						variant={HTTP_METHOD_BADGE_MAP[endpoint.method]}
						text={endpoint.method}
					/>
				</div>
				<div className='relative flex-[0.8] flex flex-col items-center justify-center'>
					<Input
						className='rounded-none rounded-r w-full !h-7 text-xs'
						value={endpoint.path}
						disabled
					/>
					<CopyButton
						text={`${BASE_URL}/${environment?.iid}${endpoint.path}`}
						className='absolute right-1'
					/>
				</div>
			</div>
			<TestEndpoint
				open={isTestEndpointOpen}
				onClose={() => {
					setIsTestEndpointOpen(false);
					searchParams.delete('t');
					setSearchParams(searchParams);
				}}
			/>
		</VersionEditorLayout>
	);
}
