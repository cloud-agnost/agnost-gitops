import { Alert, AlertDescription, AlertTitle } from '@/components/Alert';
import { Button } from '@/components/Button';
import { Description } from '@/components/Description';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/Form';
import { Input } from '@/components/Input';
import { SuccessCheck } from '@/components/icons';
import { AuthLayout } from '@/layouts/AuthLayout';
import { GuestOnly } from '@/router';
import useAuthStore from '@/store/auth/authStore.ts';
import { APIError } from '@/types';
import { translate } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as z from 'zod';
import './auth.scss';

const FormSchema = z.object({
	email: z
		.string({
			required_error: translate('forms.required', {
				label: translate('login.email_address'),
			}),
		})
		.email(translate('forms.email.error')),
});

export default function ForgotPassword() {
	const { resetPassword } = useAuthStore();
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<APIError | null>(null);
	const { t } = useTranslation();
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
	});

	async function onSubmit(data: z.infer<typeof FormSchema>) {
		try {
			setError(null);
			setLoading(true);
			setSuccess(false);
			await resetPassword(data.email);
			setSuccess(true);
		} catch (e) {
			setError(e as APIError);
		} finally {
			setLoading(false);
		}
	}

	if (success) {
		return (
			<GuestOnly>
				<div className='flex justify-center items-center flex-col min-h-screen text-center text-subtle px-4'>
					<SuccessCheck className='w-[172px] h-[172px]  mb-12'></SuccessCheck>
					<h1 className='text-default font-semibold leading-[44px] text-[26px] mb-2'>
						{t('login.password_reset_message_sent')}
					</h1>
					<div className='flex flex-col gap-6 leading-6 font-normal'>
						<p>
							<Trans
								i18nKey='login.sent_reset_password_email'
								values={{ email: form.getValues().email }}
								components={{
									email: <span className='block text-default' />,
								}}
							/>
						</p>
						<p>{t('login.if_you_dont_receive_email')}</p>
					</div>
					<Link className='text-default mt-14 hover:underline flex items-center' to='/login'>
						{t('login.back_to_login')}
					</Link>
				</div>
			</GuestOnly>
		);
	}

	return (
		<AuthLayout>
			<GuestOnly>
				<div className='auth-page'>
					<Description title={t('login.forgot_password_page')}>
						{t('login.forgot_password_desc')}
					</Description>

					{error && error.code !== 'invalid_credentials' && (
						<>
							<Alert className='!max-w-full' variant='error'>
								<AlertTitle>{error.error}</AlertTitle>
								<AlertDescription>{error.details}</AlertDescription>
							</Alert>
						</>
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
												error={
													Boolean(form.formState.errors.email) ||
													error?.code === 'invalid_credentials'
												}
												type='email'
												placeholder={t('login.enter_email') as string}
												{...field}
											/>
										</FormControl>
										<FormMessage>
											{form.formState.errors.email?.message || error?.details}
										</FormMessage>
									</FormItem>
								)}
							/>

							<div className='flex justify-end gap-4'>
								<Button to='/login' variant='text' size='lg'>
									{t('login.back_to_login')}
								</Button>
								<Button loading={loading} size='lg' type='submit'>
									{t('login.get_reset_link')}
								</Button>
							</div>
						</form>
					</Form>
				</div>
			</GuestOnly>
		</AuthLayout>
	);
}
