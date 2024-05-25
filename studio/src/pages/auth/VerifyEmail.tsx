import { Alert, AlertDescription, AlertTitle } from '@/components/Alert';
import { Button } from '@/components/Button';
import { Description } from '@/components/Description';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/Form';
import { VerificationCodeInput } from '@/components/VerificationCodeInput';
import { AuthLayout } from '@/layouts/AuthLayout';
import useAuthStore from '@/store/auth/authStore.ts';
import { APIError } from '@/types';
import { translate } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import * as z from 'zod';
import './auth.scss';
import { GuestOnly } from '@/router';

const FormSchema = z.object({
	code: z
		.string({
			required_error: translate('forms.required', {
				label: translate('login.verification_code'),
			}),
		})
		.max(6, translate('forms.verificationCode.length.error'))
		.min(6, translate('forms.verificationCode.length.error'))
		.transform((val) => Number(val)),
});

export default function VerifyEmail() {
	const [searchParams] = useSearchParams();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<APIError | null>(null);
	const { t } = useTranslation();
	const { verifyEmail } = useAuthStore();

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
	});

	async function onSubmit(data: z.infer<typeof FormSchema>) {
		const email = searchParams.get('email');
		if (!email) return;
		try {
			setError(null);
			setLoading(true);
			await verifyEmail(email, data.code);
		} catch (e) {
			setError(e as APIError);
		} finally {
			setLoading(false);
		}
	}

	return (
		<AuthLayout>
			<GuestOnly>
				<div className='auth-page'>
					<Description title={t('login.verify_your_email')}>
						<Trans
							i18nKey='login.sent_verification_code'
							values={{ email: searchParams.get('email') }}
							components={{
								email: <span className='text-default' />,
							}}
						/>
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
								name='code'
								render={({ field }) => (
									<FormItem className='space-y-1'>
										<FormControl>
											<VerificationCodeInput error={!!form.formState.errors.code} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Description>{t('login.verification_page_info')}</Description>

							<div className='flex justify-end gap-4'>
								<Button loading={loading} size='lg' type='submit'>
									{t('login.verify')}
								</Button>
							</div>
						</form>
					</Form>
				</div>
			</GuestOnly>
		</AuthLayout>
	);
}
