import { Alert, AlertDescription, AlertTitle } from '@/components/Alert';
import { Button } from '@/components/Button';
import { Description } from '@/components/Description';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/Form';
import { AuthLayout } from '@/layouts/AuthLayout';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { PasswordInput } from '@/components/PasswordInput';
import useAuthStore from '@/store/auth/authStore.ts';
import { translate } from '@/utils';
import { CaretLeft } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useLoaderData } from 'react-router-dom';
import './auth.scss';

const FormSchema = z
	.object({
		password: z
			.string({
				required_error: translate('forms.required', {
					label: translate('login.password'),
				}),
			})
			.min(8, translate('forms.min8.error', { label: translate('login.password') })),
		confirm: z
			.string({
				required_error: translate('forms.required', {
					label: translate('login.password'),
				}),
			})
			.min(8, translate('forms.min8.error', { label: translate('login.password') })),
	})
	.refine((data) => data.password === data.confirm, {
		message: translate('profileSettings.password_dont_match'),
		path: ['confirm'],
	});

export default function ChangePasswordWithToken() {
	const { isAuthenticated } = useAuthStore();
	const { changePasswordWithToken } = useAuthStore();
	const token = useLoaderData() as string;
	const [success, setSuccess] = useState(false);
	const { t } = useTranslation();
	const isLogged = isAuthenticated();
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
	});
	const {
		mutateAsync: changePassword,
		isPending,
		error,
	} = useMutation({
		mutationFn: changePasswordWithToken,
		mutationKey: ['changePasswordWithToken'],
		onSuccess: () => {
			setSuccess(true);
			form.reset();
		},
	});
	async function onSubmit(data: z.infer<typeof FormSchema>) {
		changePassword({
			token,
			newPassword: data.password,
		});
	}

	return (
		<AuthLayout>
			<div className='auth-page'>
				<Description title={t('login.change_your_password')}>
					{t('login.enter_new_password_desc')}
				</Description>

				{error && (
					<Alert className='!max-w-full' variant='error'>
						<AlertTitle>{error.error}</AlertTitle>
						<AlertDescription>{error.details}</AlertDescription>
					</Alert>
				)}

				{success ? (
					<div className='space-y-8'>
						<Alert className='!max-w-full mb-8' variant='success'>
							<AlertTitle>{t('login.changed_successfully')}</AlertTitle>
							<AlertDescription>{t('login.changed_successfully_desc')}</AlertDescription>
						</Alert>
						{!isLogged && (
							<Link
								to='/login'
								className='text-default hover:underline mt-4 flex items-center justify-center'
							>
								<CaretLeft className='mr-1 inline-block' />
								{t('login.back_to_login')}
							</Link>
						)}
					</div>
				) : (
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className='auth-form'>
							<FormField
								control={form.control}
								name='password'
								render={({ field }) => (
									<FormItem className='space-y-1'>
										<FormLabel>{t('login.password')}</FormLabel>
										<FormControl>
											<PasswordInput
												error={Boolean(form.formState.errors.password)}
												placeholder={t('login.enter_new_password') as string}
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
								name='confirm'
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('profileSettings.confirm_new_password')}</FormLabel>
										<FormControl>
											<PasswordInput
												error={Boolean(form.formState.errors?.confirm)}
												placeholder={t('profileSettings.confirm_new_password_placeholder') ?? ''}
												{...field}
											/>
										</FormControl>
										<FormDescription>{t('forms.min8.description')}</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className='flex justify-end gap-4'>
								{!isLogged && (
									<Button to='/login' variant='text' size='lg'>
										{t('login.back_to_login')}
									</Button>
								)}
								<Button loading={isPending} size='lg' type='submit'>
									{t('login.change_password')}
								</Button>
							</div>
						</form>
					</Form>
				)}
			</div>
		</AuthLayout>
	);
}
