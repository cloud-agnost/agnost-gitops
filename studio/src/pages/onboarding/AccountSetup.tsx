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
import AgnostLogo from '@/components/Logo/Logo';
import { RequireAuth } from '@/router';
import useClusterStore from '@/store/cluster/clusterStore';
import { NameSchema, OnboardingData } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
const FormSchema = z.object({
	orgName: NameSchema,
	projectName: NameSchema,
	environmentName: NameSchema,
});

export default function AccountSetup() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
	});
	const { finalizeClusterSetup } = useClusterStore();

	function onSubmit(data: z.infer<typeof FormSchema>) {
		mutate(data as OnboardingData);
	}

	const { mutate, isPending } = useMutation({
		mutationFn: finalizeClusterSetup,
		onSuccess: () => {
			navigate('/organization');
		},
	});

	return (
		<RequireAuth>
			<div className='max-w-2xl space-y-2 mx-auto'>
				<AgnostLogo className='size-36' />
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
						<FormField
							control={form.control}
							name='projectName'
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('project.name')}</FormLabel>
									<FormControl>
										<Input
											error={!!form.formState.errors.orgName}
											placeholder={t('forms.placeholder', {
												label: t('project.name'),
											}).toString()}
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
							name='environmentName'
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('project.envName')}</FormLabel>
									<FormControl>
										<Input
											error={!!form.formState.errors.orgName}
											placeholder={t('forms.placeholder', {
												label: t('project.envName'),
											}).toString()}
											{...field}
										/>
									</FormControl>
									<FormDescription>{t('forms.max64.description')}</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className='flex gap-4 justify-end'>
							<Button size='lg' type='submit' loading={isPending}>
								{t('onboarding.next')}
							</Button>
						</div>
					</form>
				</Form>
			</div>
		</RequireAuth>
	);
}
