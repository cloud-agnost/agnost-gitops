import useEnvironmentStore from '@/store/environment/environmentStore';
import { Alert, AlertDescription, AlertTitle } from '@/components/Alert';
import { EnvironmentStatus } from '@/types';
import { useTranslation } from 'react-i18next';
export default function APIServerAlert() {
	const { t } = useTranslation();
	const { environment } = useEnvironmentStore();

	if (environment?.serverStatus === EnvironmentStatus.Deploying) {
		return (
			<div className='px-5 mt-4'>
				<Alert variant='warning'>
					<AlertTitle>{t('endpoint.test.deploy.warning')}</AlertTitle>
					<AlertDescription>{t('endpoint.test.deploy.description')}</AlertDescription>
				</Alert>
			</div>
		);
	} else if (environment?.serverStatus === EnvironmentStatus.Error)
		return (
			<div className='px-5 mt-4'>
				<Alert variant='error'>
					<AlertTitle>{t('endpoint.test.deploy.error')}</AlertTitle>
					<AlertDescription>{t('endpoint.test.deploy.error_description')}</AlertDescription>
				</Alert>
			</div>
		);
}
