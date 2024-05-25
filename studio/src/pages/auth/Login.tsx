import { Alert, AlertDescription, AlertTitle } from '@/components/Alert';
import { Button } from '@/components/Button';
import { Description } from '@/components/Description';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/Form';
import { Input } from '@/components/Input';
import { PasswordInput } from '@/components/PasswordInput';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AuthService } from '@/services';
import useAuthStore from '@/store/auth/authStore.ts';
import useClusterStore from '@/store/cluster/clusterStore';
import { APIError } from '@/types';
import { translate } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as z from 'zod';
import './auth.scss';
import { GuestOnly } from '@/router';

const FormSchema = z.object({
	email: z
		.string({
			required_error: translate('forms.required', {
				label: translate('login.email_address'),
			}),
		})
		.email(translate('forms.email.error')),
	password: z.string({
		required_error: translate('forms.required', {
			label: translate('login.password'),
		}),
	}),
});

export default function Login() {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<APIError | null>(null);
	const { login } = useAuthStore();
	const { canClusterSendEmail } = useClusterStore();
	const navigate = useNavigate();
	const { state } = useLocation();

	const REDIRECT_URL = state?.from ? state.from.pathname + state.from.search : '/organization';

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
	});

	async function onSubmit({ email, password }: z.infer<typeof FormSchema>) {
		setLoading(true);
		login({
			email,
			password,
			onSuccess: () => {
				navigate(REDIRECT_URL);
				setLoading(false);
			},
			onError: (error) => {
				setError(error as APIError);
				setLoading(false);
			},
		});
	}

	if (error?.code === 'pending_email_confirmation') {
		return <NotVerified clearError={() => setError(null)} email={form.getValues().email} />;
	}

	return (
		<AuthLayout>
			<GuestOnly>
				<div className='auth-page'>
					<Description title={t('login.title')}>{t('login.description')}</Description>

					{error && (
						<Alert className='!max-w-full' variant='error'>
							<AlertTitle>{error.error}</AlertTitle>
							<AlertDescription>{error.details}</AlertDescription>
						</Alert>
					)}
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className='auth-form'>
							<FormField
								control={form.control}
								name='email'
								render={({ field }) => (
									<FormItem className='space-y-1'>
										<FormLabel>{t('login.email')}</FormLabel>
										<FormControl>
											<Input
												error={Boolean(form.formState.errors.email)}
												type='email'
												placeholder={t('login.enter_email') as string}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name='password'
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('login.password')}</FormLabel>
										<FormControl>
											<PasswordInput
												error={Boolean(form.formState.errors.password)}
												type='password'
												placeholder={t('login.enter_password') as string}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className='flex justify-end space-y-8'>
								<Button loading={loading} size='full' type='submit'>
									{t('login.login')}
								</Button>
							</div>
						</form>
					</Form>
					{canClusterSendEmail && (
						<div className='flex justify-between text-sm text-default leading-6 font-albert'>
							<Link
								className='hover:underline no-underline underline-offset-2 hover:text-disabled-reverse'
								to='/forgot-password'
							>
								{t('login.forgot_password')}
							</Link>
							<Link
								className='hover:underline no-underline underline-offset-2 hover:text-disabled-reverse'
								to='/complete-account-setup'
							>
								{t('login.complete_account_setup')}
							</Link>
						</div>
					)}
				</div>
			</GuestOnly>
		</AuthLayout>
	);
}

function NotVerified({ email, clearError }: { email: string; clearError: () => void }) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<APIError | null>(null);
	const navigate = useNavigate();
	const { t } = useTranslation();
	async function reSendVerificationCode() {
		try {
			setError(null);
			setLoading(true);
			await AuthService.resendEmailVerificationCode(email);
			navigate(`/verify-email?email=${email}`);
		} catch (error) {
			setError(error as APIError);
		} finally {
			setLoading(false);
		}
	}

	return (
		<AuthLayout>
			<GuestOnly>
				<div className='auth-page'>
					<Description title={t('login.email_verification')}>
						{t('login.email_verification_pending')}
					</Description>

					<Description className='!mt-2'>
						{t('login.email_verification_pending_desc')}{' '}
						<span className='text-default'>{email}</span>
					</Description>

					{error && (
						<Alert className='!max-w-full' variant='error'>
							<AlertTitle>{error.error}</AlertTitle>
							<AlertDescription>{error.details}</AlertDescription>
						</Alert>
					)}

					<div className='flex justify-end gap-4'>
						<Button onClick={clearError} variant='text' size='lg'>
							{t('login.back_to_login')}
						</Button>
						<Button loading={loading} onClick={reSendVerificationCode}>
							{t('login.send_verification_code')}
						</Button>
					</div>
				</div>
			</GuestOnly>
		</AuthLayout>
	);
}
