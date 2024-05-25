import { Alert, AlertDescription, AlertTitle } from '@/components/Alert';
import { Button } from '@/components/Button';
import { SettingsFormItem } from '@/components/SettingsFormItem';
import { useToast } from '@/hooks';
import useClusterStore from '@/store/cluster/clusterStore';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
export default function ClusterAddons() {
	const { t } = useTranslation();
	const { toast } = useToast();
	const { cluster, enabledCICD } = useClusterStore();

	const { isPending, mutate } = useMutation({
		mutationFn: enabledCICD,
		onSuccess: () => {
			toast({
				title: t(`cluster.${cluster.cicdEnabled ? 'gitOpsEnabled' : 'gitOpsDisabled'}`) as string,
				action: 'success',
			});
		},
		onError: (error) => {
			toast({
				title: error.details,
				action: 'error',
			});
		},
	});

	return (
		<SettingsFormItem
			className='space-y-0 py-0 pb-6'
			contentClassName='pt-6'
			title={t('cluster.gitOps')}
			description={t('cluster.gitOpsDescription')}
		>
			{cluster.cicdEnabled ? (
				<Alert variant='success'>
					<AlertTitle>{t('cluster.gitOpsActive')}</AlertTitle>
					<AlertDescription>{t('cluster.gitOpsActiveDescription')}</AlertDescription>
				</Alert>
			) : (
				<Button variant='primary' onClick={mutate} loading={isPending}>
					{t('cluster.activate')}
				</Button>
			)}
		</SettingsFormItem>
	);
}
