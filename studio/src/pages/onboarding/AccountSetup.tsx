import { Alert, AlertDescription, AlertTitle } from '@/components/Alert';
import { Button } from '@/components/Button';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/Form';
import { Agnost } from '@/components/icons';
import { Input } from '@/components/Input';
import useClusterStore from '@/store/cluster/clusterStore';
import { ChangeNameFormSchema, NameSchema, OnboardingData } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import * as z from 'zod';
const FormSchema = z.object({
	orgName: ChangeNameFormSchema.shape.name,
	projectName: ChangeNameFormSchema.shape.name,
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

	const { mutate, isPending, error } = useMutation({
		mutationFn: finalizeClusterSetup,
		onSuccess: (data) => {
			navigate(
				`/organization/${data.org._id}/projects/${data.project._id}/env/${data.environment._id}`,
			);
		},
	});

	return (
		<div className='h-screen m-auto dark:bg-base flex flex-col items-center justify-center'>
			<Agnost className='size-24' />
			<div className='space-y-8 max-w-lg'>
				<div className='space-y-2 text-center'>
					<h1 className='text-2xl font-bold'>{t('onboarding.org.title')}</h1>
					<p className='text-subtle text-sm'>{t('onboarding.org.desc')}</p>
				</div>
				{error?.error && (
					<Alert className='!max-w-full' variant='error'>
						<AlertTitle>{error.error}</AlertTitle>
						<AlertDescription>{error.details}</AlertDescription>
					</Alert>
				)}
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
		</div>
	);
}
