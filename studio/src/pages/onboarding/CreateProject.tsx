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
import { RequireAuth } from '@/router';
import { NameSchema } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';

const FormSchema = z.object({
	orgName: NameSchema,
	projectName: NameSchema,
	envName: NameSchema,
});

export default function CreateProject() {
	const { t } = useTranslation();
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			orgName: 'orgName',
			projectName: 'projectName',
			envName: 'envName',
		},
	});

	function onSubmit() {
		//data: z.infer<typeof FormSchema>
		//Todo - Add API call to create organization
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
						<FormField
							control={form.control}
							name='projectName'
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
							name='envName'
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
