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
import { useNavigate } from 'react-router-dom';
import useOnboardingStore from '@/store/onboarding/onboardingStore.ts';
import { translate } from '@/utils';
import { useTranslation } from 'react-i18next';
import { RequireAuth } from '@/router';

const FormSchema = z.object({
	orgName: z
		.string({
			required_error: translate('forms.required', {
				label: translate('organization.name'),
			}),
		})
		.min(2, {
			message: translate('forms.min2.error', { label: translate('organization.name') }),
		})
		.max(64, {
			message: translate('forms.max64.error', { label: translate('organization.name') }),
		})
		.trim()
		.refine(
			(value) => value.trim().length > 0,
			translate('forms.required', {
				label: translate('organization.name'),
			}),
		),
});

export default function CreateOrganization() {
	const navigate = useNavigate();
	const { setDataPartially, getCurrentStep, goToNextStep, data } = useOnboardingStore();
	const { t } = useTranslation();
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			orgName: data.orgName,
		},
	});

	function onSubmit(data: z.infer<typeof FormSchema>) {
		setDataPartially({
			orgName: data.orgName,
		});
		const { nextPath } = getCurrentStep();
		if (nextPath) {
			navigate(nextPath);
			goToNextStep(true);
		}
	}

	return (
		<RequireAuth>
			<>
				<Description title={t('onboarding.org.title')}>{t('onboarding.org.desc')}</Description>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
						<FormField
							control={form.control}
							name='orgName'
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('organization.name')}</FormLabel>
									<FormControl>
										<Input
											error={!!form.formState.errors.orgName}
											placeholder={t('organization.enter_organization_name') as string}
											{...field}
										/>
									</FormControl>
									<FormDescription>{t('forms.max64.description')}</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className='flex gap-4 justify-end'>
							<Button size='lg' type='submit'>
								{t('onboarding.next')}
							</Button>
						</div>
					</form>
				</Form>
			</>
		</RequireAuth>
	);
}
