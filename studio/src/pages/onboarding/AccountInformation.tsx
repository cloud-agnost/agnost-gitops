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
import { Input } from '@/components/Input';
import { PasswordInput } from '@/components/PasswordInput';
import { GuestOnly } from '@/router';
import useClusterStore from '@/store/cluster/clusterStore.ts';
import useOnboardingStore from '@/store/onboarding/onboardingStore.ts';
import { APIError } from '@/types';
import { translate } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import * as z from 'zod';

const FormSchema = z.object({
	email: z
		.string({
			required_error: translate('forms.required', {
				label: translate('login.email'),
			}),
		})
		.email(translate('forms.email.error')),
	password: z
		.string({
			required_error: translate('forms.required', {
				label: translate('login.password'),
			}),
		})
		.min(8, {
			message: translate('forms.min8.error', { label: translate('login.password') }),
		}),
	name: z
		.string({
			required_error: translate('forms.required', { label: translate('login.name') }),
		})
		.min(2, {
			message: translate('forms.min2.error', { label: translate('login.name') }),
		})
		.max(64, {
			message: translate('forms.max64.error', { label: translate('login.name') }),
		})
		.trim()
		.refine(
			(value) => value.trim().length > 0,
			translate('forms.required', { label: translate('login.name') }),
		),
});

export default function AccountInformation() {
	const [initiating, setInitiating] = useState(false);
	const [error, setError] = useState<APIError | null>(null);
	const { goToNextStep } = useOnboardingStore();
	const { initializeClusterSetup } = useClusterStore();
	const { t } = useTranslation();
	const navigate = useNavigate();

	const { getCurrentStep } = useOnboardingStore();

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
	});

	async function onSubmit(data: z.infer<typeof FormSchema>) {
		setInitiating(true);
		setError(null);
		initializeClusterSetup({
			...data,
			onSuccess: () => {
				const { nextPath } = getCurrentStep();
				if (nextPath) {
					navigate(nextPath);
					goToNextStep(true);
				}
				setInitiating(false);
			},
			onError: (e) => {
				setError(e);
				setInitiating(false);
			},
		});
	}

	return (
		<GuestOnly>
			<h1 className='text-default font-semibold text-[1.625rem] leading-[2.75rem] text-center'>
				{t('onboarding.welcome')}
			</h1>
			<Description title={t('onboarding.account_info')}>{t('onboarding.welcome_desc')}</Description>

			{error && (
				<Alert className='!max-w-full' variant='error'>
					<AlertTitle>{error.error}</AlertTitle>
					<AlertDescription>{error.details}</AlertDescription>
				</Alert>
			)}

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
					<FormField
						control={form.control}
						name='email'
						render={({ field }) => (
							<FormItem>
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
								<FormDescription>{t('forms.min8.description')}</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name='name'
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t('login.name')}</FormLabel>
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
					<div className='flex justify-end'>
						<Button loading={initiating} size='lg' type='submit'>
							{t('onboarding.next')}
						</Button>
					</div>
				</form>
			</Form>
		</GuestOnly>
	);
}
