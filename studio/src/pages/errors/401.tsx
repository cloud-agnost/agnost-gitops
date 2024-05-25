import { Svg401 } from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { ArrowLeft } from '@phosphor-icons/react';
import useAuthStore from '@/store/auth/authStore';
export default function UnauthorizedAccess() {
	const { t } = useTranslation();
	const { isAuthenticated } = useAuthStore();
	return (
		<div className='w-full h-screen flex flex-col items-center justify-center'>
			<div className='flex flex-col items-center space-y-2'>
				<Svg401 className='w-36 h-32' />

				<h2 className='text-default text-2xl font-semibold '>{t('general.unauthorizedAccess')}</h2>
				<p className='text-lg text-subtle font-sfCompact '>
					{t('general.unauthorizedAccessDescription')}
				</p>
			</div>
			{isAuthenticated() ? (
				<Button className='mt-8' variant='primary' to='/organization'>
					<ArrowLeft className='mr-2' />
					{t('general.backToHome')}
				</Button>
			) : (
				<Button className='mt-8' variant='primary' to='/login'>
					<ArrowLeft className='mr-2' />
					{t('login.back_to_login')}
				</Button>
			)}
		</div>
	);
}
