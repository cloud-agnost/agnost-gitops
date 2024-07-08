import { AuthLayout } from '@/layouts/AuthLayout';
import { GuestOnly } from '@/router';
import { APIError } from '@/types';
import { useTranslation } from 'react-i18next';
import { useLoaderData } from 'react-router-dom';
export default function Register() {
	const { t } = useTranslation();
	const error = useLoaderData() as APIError | undefined;

	return (
		<GuestOnly>
			<AuthLayout
				title={t('onboarding.welcome')}
				subtitle={t('onboarding.welcome_desc')}
				error={error}
			/>
		</GuestOnly>
	);
}
