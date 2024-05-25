import { Switch } from '@/components/Switch';
import { useAuthorizeVersion, useToast } from '@/hooks';
import useEnvironmentStore from '@/store/environment/environmentStore';
import { APIError } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
export default function AutoRedeploy() {
	const { toast } = useToast();
	const { toggleAutoDeploy, environment } = useEnvironmentStore();
	const canDeploy = useAuthorizeVersion('env.deploy');
	const { orgId, appId, versionId } = useParams() as Record<string, string>;
	const { mutateAsync: toggleAutoDeployMutate } = useMutation({
		mutationFn: toggleAutoDeploy,
		onError: (error: APIError) => {
			toast({
				action: 'error',
				title: error.details,
			});
		},
		onSuccess: () => {
			toast({
				action: 'success',
				title: 'Auto deploy updated successfully',
			});
		},
	});

	async function onAutoDeployStatusChanged(autoDeploy: boolean) {
		if (!environment?._id) return;
		toggleAutoDeployMutate({
			orgId,
			appId,
			versionId,
			envId: environment._id,
			autoDeploy,
		});
	}
	return (
		<Switch
			checked={!!environment?.autoDeploy}
			onCheckedChange={onAutoDeployStatusChanged}
			disabled={!canDeploy}
		/>
	);
}
