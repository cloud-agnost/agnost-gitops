import { Button } from '@/components/Button';
import { Error } from '@/components/Error';
import { ArrowLeft } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
export default function ErrorBoundary() {
	const { t } = useTranslation();
	return (
		<Error>
			<Button className='mt-8' variant='primary' to='/organization'>
				<ArrowLeft className='mr-2' />
				{t('general.backToHome')}
			</Button>
		</Error>
	);
}
