import { Feedback } from '@/components/Alert';
import { Loading } from '@/components/Loading';
import { AuthLayout } from '@/layouts/AuthLayout';
import useAuthStore from '@/store/auth/authStore';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

export default function ConfirmChangeEmail() {
	const { confirmChangeLoginEmail } = useAuthStore();
	const [searchParams] = useSearchParams();
	const {
		mutateAsync: confirmEmail,
		error,
		isSuccess,
		isPending,
	} = useMutation({
		mutationFn: confirmChangeLoginEmail,
	});
	const { t } = useTranslation();
	const title = isSuccess ? t('profileSettings.email_updated_success') : error?.error;
	const description = isSuccess
		? t('profileSettings.email_updated_success_description')
		: error?.details;

	useEffect(() => {
		confirmEmail(searchParams.get('token'));
	}, []);
	return (
		<AuthLayout>
			<div className='flex flex-col items-center justify-center h-full relative'>
				{isPending ? (
					<Loading loading={isPending} />
				) : (
					<Feedback success={isSuccess} title={title} description={description} />
				)}
			</div>
		</AuthLayout>
	);
}
