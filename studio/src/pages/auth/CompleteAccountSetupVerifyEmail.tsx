import { Feedback } from '@/components/Alert';
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
import { Input } from '@/components/Input';
import { PasswordInput } from '@/components/PasswordInput';
import { VerificationCodeInput } from '@/components/VerificationCodeInput';
import { AuthLayout } from '@/layouts/AuthLayout';
import useAuthStore from '@/store/auth/authStore';
import { APIError } from '@/types/type.ts';
import { translate } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as z from 'zod';
import './auth.scss';

const FormSchema = z.object({
	verificationCode: z
		.string()
		.max(6, translate('forms.verificationCode.length.error'))
		.min(6, translate('forms.verificationCode.length.error'))
		.optional()
		.or(z.literal(''))
		.transform((val) => Number(val))
		.superRefine((val, ctx) => {
			const url = new URL(window.location.href);
			const token = url.searchParams.has('token');
			if (!token && !val) {
				return ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: translate('forms.required', {
						label: translate('login.verification_code'),
					}),
					path: ['verificationCode'],
				});
			}
		}),
	password: z
		.string({
			required_error: translate('forms.required', {
				label: translate('login.password'),
			}),
		})
		.min(
			8,
			translate('forms.min8.error', {
				label: translate('login.name'),
			}),
		),
	name: z
		.string({
			required_error: translate('forms.required', {
				label: translate('login.name'),
			}),
		})
		.min(
			2,
			translate('forms.min2.error', {
				label: translate('login.name'),
			}),
		)
		.max(
			64,
			translate('forms.max64.error', {
				label: translate('login.name'),
			}),
		)
		.trim()
		.refine(
			(value) => value.trim().length > 0,
			translate('forms.required', {
				label: translate('login.name'),
			}),
		),
});

export default function CompleteAccountSetupVerifyEmail() {
	const [searchParams] = useSearchParams();
	const [error, setError] = useState<APIError | null>();
	const isVerified = searchParams.has('isVerified');
	const token = searchParams.get('token');
	const type = searchParams.get('type');
	const {
		completeAccountSetup,
		finalizeAccountSetup,
		email,
		user,
		isAuthenticated,
		appAcceptInvite,
		orgAcceptInvite,
		projectAcceptInvite,
	} = useAuthStore();
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
	});
	const { t } = useTranslation();
	const navigate = useNavigate();
	const {
		mutate: acceptInvitation,
		data,
		isPending,
	} = useMutation({
		mutationFn: handleAcceptInvitation,
		onError: (err: APIError) => setError(err),
	});
	const { mutate: finalizeAccountSetupMutate, isPending: finalizeLoading } = useMutation({
		mutationFn: finalizeAccountSetup,
		onError: (err: APIError) => setError(err),
		onSuccess: () => navigate('/organization'),
	});
	const { mutate: completeAccountSetupMutate, isPending: completeLoading } = useMutation({
		mutationFn: completeAccountSetup,
		onError: (err: APIError) => setError(err),
		onSuccess: () => navigate('/organization'),
	});

	function handleAcceptInvitation(token: string) {
		if (type === 'org') {
			return orgAcceptInvite(token);
		}
		if (type === 'app') {
			return appAcceptInvite(token);
		}
		return projectAcceptInvite(token);
	}

	const successDesc =
		data?.user?.status === 'Active'
			? t('login.you_have_been_added', {
					name: data?.org?.name ?? data?.app?.name ?? data?.project?.name,
					role: data?.role,
				})
			: t('login.complete_account_setup_desc');
	async function onSubmit(data: z.infer<typeof FormSchema>) {
		if (!token) {
			finalizeAccountSetupMutate({
				email: email as string,
				verificationCode: data.verificationCode,
				name: data.name,
				password: data.password,
			});
		} else {
			completeAccountSetupMutate({
				email: user?.loginProfiles[0].email,
				token,
				name: data.name,
				password: data.password,
				inviteType: searchParams.get('type'),
			});
		}
	}

	useEffect(() => {
		if (error && error.code === 'invalid_validation_code') {
			form.setError('verificationCode', {
				message: '',
			});
		}
	}, [error]);

	useEffect(() => {
		if (token) acceptInvitation(token);
	}, []);

	return (
		<AuthLayout className='flex flex-col items-center justify-center h-full'>
			<div className='auth-page'>
				{!isPending && (error || isVerified) && (
					<Feedback
						success={isVerified && !error}
						title={isVerified && !error ? t('general.invitation_accepted') : error?.error ?? ''}
						description={isVerified && !error ? successDesc : error?.details ?? ''}
					/>
				)}
				{!(error || isVerified) && <Description title={t('login.complete_account_setup')} />}
				{(!token || (data && data.user?.status !== 'Active')) && (
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
							{!isVerified && (
								<FormField
									control={form.control}
									name='verificationCode'
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('login.verification_code')}</FormLabel>
											<FormControl>
												<VerificationCodeInput
													error={Boolean(form.formState.errors.verificationCode)}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}
							<FormField
								control={form.control}
								name='name'
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('login.name')}</FormLabel>
										<FormDescription>{t('login.name_desc')}</FormDescription>
										<FormControl>
											<Input
												error={Boolean(form.formState.errors.name)}
												placeholder={t('login.enter_name') as string}
												{...field}
											/>
										</FormControl>
										<FormDescription>{t('forms.max64.description')}</FormDescription>
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
										<FormDescription>{t('login.password_desc')}</FormDescription>
										<FormControl>
											<PasswordInput
												error={Boolean(form.formState.errors.password)}
												type='password'
												placeholder={t('login.password') as string}
												{...field}
											/>
										</FormControl>
										<FormDescription>{t('forms.min8.description')}</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className='flex justify-end'>
								<Button loading={finalizeLoading || completeLoading} size='lg' type='submit'>
									{t('login.complete_setup')}
								</Button>
							</div>
						</form>
					</Form>
				)}

				{data && data.user?.status === 'Active' && (
					<div className='flex justify-center'>
						<Button
							size='xl'
							onClick={() => navigate(isAuthenticated() ? '/organization' : '/login')}
						>
							{isAuthenticated() ? t('organization.select') : t('login.back_to_login')}
						</Button>
					</div>
				)}
			</div>
		</AuthLayout>
	);
}
