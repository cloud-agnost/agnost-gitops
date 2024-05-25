import { Alert, AlertDescription, AlertTitle } from '@/components/Alert';
import { Button } from '@/components/Button';
import { Description } from '@/components/Description';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/Form';
import { Input } from '@/components/Input';
import { AuthLayout } from '@/layouts/AuthLayout';
import useAuthStore from '@/store/auth/authStore';
import { APIError } from '@/types';
import { translate } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
});

export default function CompleteAccountSetup() {
	const navigate = useNavigate();
	const [error, setError] = useState<APIError | null>(null);
	const [loading, setLoading] = useState(false);
	const { initiateAccountSetup } = useAuthStore();
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
	});
	const { t } = useTranslation();

	async function onSubmit(data: z.infer<typeof FormSchema>) {
		setLoading(true);
		await initiateAccountSetup(
			data.email,
			() => {
				navigate('verify-email');
				setLoading(false);
			},
			(e) => {
				setError(e as APIError);
				setLoading(false);
			},
		);
	}

	return (
		<AuthLayout>
			<GuestOnly>
				<div className='auth-page'>
					<Description title={t('login.complete_account_setup')}>
						{t('login.complete_account_setup_info')}
					</Description>

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
												placeholder={t('login.enter_email') as string}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className='flex justify-end gap-4'>
								<Button to='/login' variant='text' size='lg'>
									{t('login.back_to_login')}
								</Button>
								<Button size='lg' loading={loading} type='submit'>
									{t('login.continue')}
								</Button>
							</div>
						</form>
					</Form>
				</div>
			</GuestOnly>
		</AuthLayout>
	);
}
