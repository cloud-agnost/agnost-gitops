import { Button, ButtonProps } from '@/components/Button';
import { useAuthorizeVersion, useEnvironmentStatus, useToast } from '@/hooks';
import useEnvironmentStore from '@/store/environment/environmentStore.ts';
import { APIError, EnvironmentStatus } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

export default function DeployButton(props: Omit<ButtonProps, 'loading' | 'onClick'>) {
	const { t } = useTranslation();
	const { toast } = useToast();
	const canDeploy = useAuthorizeVersion('env.deploy');
	const { environment, redeployAppVersionToEnvironment } = useEnvironmentStore();
	const envStatus = useEnvironmentStatus();
	const { versionId, appId, orgId } = useParams<{
		versionId: string;
		appId: string;
		orgId: string;
	}>();
	const { mutateAsync: redeployMutate, isPending } = useMutation({
		mutationFn: redeployAppVersionToEnvironment,
		onError: (error: APIError) => {
			toast({
				action: 'error',
				title: error.details,
			});
		},
	});
	async function redeploy() {
		if (!versionId || !appId || !orgId || !environment) return;
		redeployMutate({
			orgId,
			appId,
			versionId,
			envId: environment._id,
		});
	}

	return (
		<Button
			onClick={redeploy}
			loading={isPending}
			disabled={envStatus === EnvironmentStatus.Deploying || !canDeploy}
			className='w-24'
			{...props}
		>
			{t('version.redeploy')}
		</Button>
	);
}
