import { Button } from '@/components/Button';
import { useAuthorizeVersion } from '@/hooks';
import { toast } from '@/hooks/useToast';
import useEnvironmentStore from '@/store/environment/environmentStore';
import { APIError } from '@/types';
import { cn } from '@/utils';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
export default function SuspendButton() {
	const { t } = useTranslation();
	const canEdit = useAuthorizeVersion('env.update');
	const { suspendEnvironment, activateEnvironment, environment } = useEnvironmentStore();
	const { orgId, versionId, appId } = useParams<{
		versionId: string;
		appId: string;
		orgId: string;
	}>();

	const { mutateAsync: suspendOrActiveMutate, isPending } = useMutation({
		mutationFn: environment?.suspended ? activateEnvironment : suspendEnvironment,
		onSuccess: () => {
			toast({
				action: 'success',
				title: environment?.suspended
					? (t('version.suspend_success') as string)
					: (t('version.reactivated_successfully') as string),
			});
		},
		onError: (error: APIError) => {
			toast({
				action: 'error',
				title: error.details,
			});
		},
	});

	async function suspendOrActive() {
		if (!versionId || !appId || !orgId || !environment?._id) return;
		suspendOrActiveMutate({
			envId: environment._id,
			orgId,
			appId,
			versionId,
		});
	}
	return (
		<Button
			disabled={!canEdit}
			className={cn(!environment?.suspended && '!text-elements-red')}
			variant={environment?.suspended ? 'primary' : 'outline'}
			onClick={suspendOrActive}
			loading={isPending}
		>
			{environment?.suspended ? t('version.reactivate') : t('version.suspend')}
		</Button>
	);
}
