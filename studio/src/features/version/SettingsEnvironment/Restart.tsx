import { Button } from '@/components/Button';
import { SettingsFormItem } from '@/components/SettingsFormItem';
import useEnvironmentStore from '@/store/environment/environmentStore';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks';
import { useTranslation } from 'react-i18next';
import { APIError } from '@/types';
import { useParams } from 'react-router-dom';
export default function Restart() {
	const { t } = useTranslation();
	const { restartApiServers, environment } = useEnvironmentStore();
	const { toast } = useToast();
	const { versionId, appId, orgId } = useParams() as Record<string, string>;
	const { isPending, mutateAsync } = useMutation({
		mutationFn: () => restartApiServers({ orgId, appId, versionId, envId: environment._id }),
		onError: (error: APIError) => {
			toast({
				action: 'error',
				title: error.details,
			});
		},
		onSuccess: () => {
			toast({
				action: 'success',
				title: t('version.restart_success') as string,
			});
		},
	});
	return (
		<SettingsFormItem
			className='space-y-0 py-6'
			contentClassName='flex items-center justify-end'
			twoColumns
			title={t('version.restart')}
			description={t('version.restart_desc')}
		>
			<Button variant='primary' loading={isPending} onClick={mutateAsync}>
				{t('version.restart')}
			</Button>
		</SettingsFormItem>
	);
}
