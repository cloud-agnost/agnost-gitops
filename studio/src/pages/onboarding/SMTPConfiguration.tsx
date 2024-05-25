import { Alert, AlertDescription, AlertTitle } from '@/components/Alert';
import { Button } from '@/components/Button';
import { Description } from '@/components/Description';
import { Form } from '@/components/Form';
import { SMTPForm } from '@/components/SMTPForm';
import { RequireAuth } from '@/router';
import { PlatformService } from '@/services';
import useClusterStore from '@/store/cluster/clusterStore.ts';
import useOnboardingStore from '@/store/onboarding/onboardingStore.ts';
import { APIError, ClusterSetupResponse, SMTPSchema } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext } from 'react-router-dom';
import * as z from 'zod';
export default function SMTPConfiguration() {
	const [error, setError] = useState<APIError | null>(null);
	const [isTesting, setIsTesting] = useState(false);
	const [finalizing, setFinalizing] = useState(false);
	const { t } = useTranslation();

	const {
		setDataPartially,
		getCurrentStep,
		goToNextStep,
		setStepByPath,
		data: onboardingData,
	} = useOnboardingStore();

	const { finalizeClusterSetup } = useClusterStore();
	const { goBack } = useOutletContext() as { goBack: () => void };

	const navigate = useNavigate();
	const form = useForm<z.infer<typeof SMTPSchema>>({
		resolver: zodResolver(SMTPSchema),
		defaultValues: {
			...onboardingData.smtp,
		},
	});

	async function onSubmit(data: z.infer<typeof SMTPSchema>) {
		try {
			setIsTesting(true);
			setError(null);
			await PlatformService.testSMTPSettings({
				host: data.host,
				port: data.port,
				user: data.user,
				password: data.password,
				useTLS: data.useTLS,
			});
			const { nextPath } = getCurrentStep();
			setDataPartially({
				smtp: data,
			});
			if (nextPath) {
				navigate(nextPath);
				goToNextStep(true);
			}
		} catch (error) {
			setError(error as APIError);
		} finally {
			setIsTesting(false);
		}
	}

	async function finishSetup() {
		setFinalizing(true);
		finalizeClusterSetup({
			...onboardingData,
			uiBaseURL: window.location.origin,
			onSuccess: (res: ClusterSetupResponse) => {
				setStepByPath('/onboarding/smtp-configuration', {
					isDone: true,
				});
				setFinalizing(false);
				navigate(`/organization/${res.org._id}/apps`);
			},
			onError: (error: APIError) => {
				setError(error as APIError);
				setFinalizing(false);
			},
		});
	}

	return (
		<RequireAuth>
			<>
				<Description title={t('onboarding.smtp.title')}>{t('onboarding.smtp.desc')}</Description>

				{error && (
					<Alert className='!max-w-full' variant='error'>
						<AlertTitle>{error.error}</AlertTitle>
						<AlertDescription>{error.details}</AlertDescription>
					</Alert>
				)}

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-3.5'>
						<SMTPForm />
						<div className='flex gap-4 justify-end'>
							<Button onClick={goBack} variant='text' size='lg'>
								{t('onboarding.previous')}
							</Button>
							<Button loading={finalizing} onClick={finishSetup} variant='secondary' size='lg'>
								{t('onboarding.skip_and_finish')}
							</Button>
							<Button loading={isTesting} size='lg' type='submit'>
								{t('onboarding.next')}
							</Button>
						</div>
					</form>
				</Form>
			</>
		</RequireAuth>
	);
}
