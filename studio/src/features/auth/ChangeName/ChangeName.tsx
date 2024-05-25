import useAuthStore from '@/store/auth/authStore.ts';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormMessage,
} from 'components/Form';
import { Input } from 'components/Input';
import { Button } from '@/components/Button';

import './changeName.sass';
import { useTranslation } from 'react-i18next';
import { translate } from '@/utils';
import { useState } from 'react';
import { APIError } from '@/types';
import { Alert, AlertDescription, AlertTitle } from 'components/Alert';
import { useToast } from '@/hooks';

const FormSchema = z.object({
	name: z
		.string({
			required_error: translate('forms.required', {
				label: translate('profileSettings.name'),
			}),
		})
		.min(2, translate('forms.min2.error', { label: translate('profileSettings.name') }))
		.max(64, translate('forms.max64.error', { label: translate('profileSettings.name') }))
		.trim()
		.refine(
			(value) => value.trim().length > 0,
			translate('forms.required', {
				label: translate('profileSettings.name'),
			}),
		),
});

export default function ChangeName() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<APIError | null>(null);
	const { toast } = useToast();
	const { user, changeName } = useAuthStore();
	const { t } = useTranslation();

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			name: user?.name,
		},
	});

	async function onSubmit(data: z.infer<typeof FormSchema>) {
		if (user?.name === data.name) return;
		try {
			setLoading(true);
			setError(null);
			await changeName(data.name);
			toast({
				action: 'success',
				title: t('profileSettings.name_updated_description') as string,
			});
		} catch (e) {
			setError(e as APIError);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className='space-y-4'>
			{error && (
				<Alert variant='error'>
					<AlertTitle>{error.error}</AlertTitle>
					<AlertDescription>{error.details}</AlertDescription>
				</Alert>
			)}

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<FormField
						control={form.control}
						name='name'
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Input
										error={Boolean(form.formState.errors.name)}
										placeholder={t('profileSettings.name_placeholder') ?? ''}
										{...field}
									/>
								</FormControl>
								<FormDescription>{t('forms.max64.description')}</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className='mt-4'>
						<Button loading={loading} size='lg' type='submit'>
							{t('profileSettings.save')}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
