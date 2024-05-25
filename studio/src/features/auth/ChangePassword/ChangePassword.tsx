import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from 'components/Form';
import { Button } from '@/components/Button';

import './changePassword.scss';
import { useTranslation } from 'react-i18next';
import { translate } from '@/utils';
import { useState } from 'react';
import { PasswordInput } from 'components/PasswordInput';
import useAuthStore from '@/store/auth/authStore.ts';
import { APIError } from '@/types';
import { Alert, AlertDescription, AlertTitle } from 'components/Alert';
import { useToast } from '@/hooks';

const FormSchema = z.object({
	currentPassword: z
		.string({
			required_error: translate('forms.required', {
				label: translate('profileSettings.current_password'),
			}),
		})
		.min(8, {
			message: translate('forms.min8.error', {
				label: translate('profileSettings.current_password'),
			}),
		}),
	newPassword: z
		.object({
			password: z
				.string({
					required_error: translate('forms.required', {
						label: translate('profileSettings.new_password'),
					}),
				})
				.min(8, {
					message: translate('forms.min8.error', {
						label: translate('profileSettings.new_password'),
					}),
				}),
			confirm: z
				.string({
					required_error: translate('forms.required', {
						label: translate('profileSettings.confirm_new_password'),
					}),
				})
				.min(8, {
					message: translate('forms.min8.error', {
						label: translate('profileSettings.confirm_new_password'),
					}),
				}),
		})
		.refine((data) => data.password === data.confirm, {
			message: translate('profileSettings.password_dont_match'),
			path: ['confirm'],
		}),
});

export default function ChangePassword() {
	const [loading, setLoading] = useState(false);
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<APIError | null>(null);
	const [isChangeMode, setIsChangeMode] = useState(false);
	const { toast } = useToast();
	const { changePassword, user, resetPassword } = useAuthStore();

	const { t } = useTranslation();
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
	});

	async function onSubmit(data: z.infer<typeof FormSchema>) {
		try {
			setError(null);
			setLoading(true);
			await changePassword(data.currentPassword, data.newPassword.password);
			toast({
				action: 'success',
				title: t('profileSettings.password_updated') as string,
			});
			close();
		} catch (error) {
			setError(error as APIError);
		} finally {
			setLoading(false);
		}
	}

	async function resetPasswordByEmail() {
		const loginEmail = user?.loginProfiles.find((profile) => profile.provider === 'agnost')?.email;
		if (!loginEmail) return;
		try {
			setError(null);
			setSending(true);
			await resetPassword(loginEmail);
			toast({
				action: 'success',
				title: t('profileSettings.email_sent_description', {
					email: loginEmail,
				}) as string,
			});
		} catch (e) {
			setError(e as APIError);
		} finally {
			setSending(false);
		}
	}

	function open() {
		setIsChangeMode(true);
	}

	function close() {
		form.reset();
		setIsChangeMode(false);
	}

	return (
		<div className='space-y-4'>
			{error && (
				<Alert variant='error'>
					<AlertTitle>{error.error}</AlertTitle>
					<AlertDescription>{error.details}</AlertDescription>
				</Alert>
			)}
			{isChangeMode ? (
				<Form {...form}>
					<form className='change-email-form' onSubmit={form.handleSubmit(onSubmit)}>
						<FormField
							control={form.control}
							name='currentPassword'
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('profileSettings.current_password')}</FormLabel>
									<FormControl>
										<PasswordInput
											error={Boolean(form.formState.errors.currentPassword)}
											placeholder={t('profileSettings.current_password_placeholder') ?? ''}
											{...field}
										/>
									</FormControl>
									<FormDescription>{t('forms.min8.description')}</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='newPassword.password'
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('profileSettings.new_password')}</FormLabel>
									<FormControl>
										<PasswordInput
											error={Boolean(form.formState.errors.newPassword?.password)}
											placeholder={t('profileSettings.new_password_placeholder') ?? ''}
											{...field}
										/>
									</FormControl>
									<FormDescription>{t('forms.min8.description')}</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='newPassword.confirm'
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('profileSettings.confirm_new_password')}</FormLabel>
									<FormControl>
										<PasswordInput
											error={Boolean(form.formState.errors.newPassword?.confirm)}
											placeholder={t('profileSettings.confirm_new_password_placeholder') ?? ''}
											{...field}
										/>
									</FormControl>
									<FormDescription>{t('forms.min8.description')}</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className='mt-4 flex gap-4 justify-end'>
							<Button onClick={close} variant='text' size='lg'>
								{t('profileSettings.cancel')}
							</Button>
							<Button loading={loading} size='lg' type='submit'>
								{t('profileSettings.update')}
							</Button>
						</div>
					</form>
				</Form>
			) : (
				<div className='space-y-4 flex flex-col items-start'>
					<Button onClick={open} size='lg'>
						{t('profileSettings.update_password')}
					</Button>
					<div className='space-y-2'>
						<p className='cant-remember'>{t('profileSettings.cant_remember_password')}</p>
						<Button
							type='submit'
							loading={sending}
							onClick={resetPasswordByEmail}
							variant='secondary'
						>
							{t('profileSettings.reset_password_by_email')}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
