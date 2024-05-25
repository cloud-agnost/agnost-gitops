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
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLoaderData, useNavigate, useOutletContext } from 'react-router-dom';
import useOnboardingStore from '@/store/onboarding/onboardingStore.ts';
import { translate } from '@/utils';
import { useTranslation } from 'react-i18next';
import { RequireAuth } from '@/router';
import useClusterStore from '@/store/cluster/clusterStore';
import { useMutation } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/Alert';
const FormSchema = z.object({
	appName: z
		.string({
			required_error: translate('forms.required', {
				label: translate('application.short_name'),
			}),
		})
		.min(2, {
			message: translate('forms.min2.error', { label: translate('application.short_name') }),
		})
		.max(64, {
			message: translate('forms.max64.error', { label: translate('application.short_name') }),
		})
		.trim()
		.refine(
			(value) => value.trim().length > 0,
			translate('forms.required', {
				label: translate('application.short_name'),
			}),
		),
});

export default function CreateApp() {
	const navigate = useNavigate();
	const { goBack } = useOutletContext() as { goBack: () => void };
	const { setDataPartially, getCurrentStep, goToNextStep, data } = useOnboardingStore();
	const { finalizeClusterSetup } = useClusterStore();
	const { t } = useTranslation();
	const { domainStatus } = useLoaderData() as { domainStatus: boolean };
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			appName: data.appName,
		},
	});

	function onSubmit(data: z.infer<typeof FormSchema>) {
		setDataPartially({ appName: data.appName });
		if (domainStatus) {
			const { nextPath } = getCurrentStep();
			if (nextPath) {
				navigate(nextPath);
				goToNextStep(true);
			}
		} else {
			finalizeMutate(data.appName);
		}
	}

	const {
		mutateAsync: finalizeMutate,
		isLoading: finalizing,
		error,
	} = useMutation({
		mutationFn: (appName: string) =>
			finalizeClusterSetup({
				...data,
				appName,
				uiBaseURL: window.location.origin,
			}),
		onSuccess: (res) => {
			setDataPartially({
				appName: data.appName,
			});
			navigate(`/organization/${res.org._id}/apps`);
		},
	});

	return (
		<RequireAuth>
			<>
				<Description title={t('onboarding.app.title')}>{t('onboarding.app.desc')}</Description>
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
							name='appName'
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('application.short_name')}</FormLabel>
									<FormControl>
										<Input
											error={!!form.formState.errors.appName}
											placeholder={t('application.enter_name') as string}
											{...field}
										/>
									</FormControl>
									<FormDescription>{t('forms.max64.description')}</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className='flex gap-4 justify-end'>
							<Button onClick={goBack} type='button' variant='text' size='lg'>
								{t('onboarding.previous')}
							</Button>
							{domainStatus || !import.meta.env.PROD ? (
								<Button size='lg' type='submit'>
									{t('onboarding.next')}
								</Button>
							) : (
								<Button type='submit' loading={finalizing} variant='primary' size='lg'>
									{t('onboarding.finish')}
								</Button>
							)}
						</div>
					</form>
				</Form>
			</>
		</RequireAuth>
	);
}
