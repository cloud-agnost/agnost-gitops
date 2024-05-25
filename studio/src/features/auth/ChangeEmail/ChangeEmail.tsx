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
	FormLabel,
	FormMessage,
} from 'components/Form';
import { Input } from 'components/Input';
import { Button } from '@/components/Button';
import './changeEmail.scss';
import { useTranslation } from 'react-i18next';
import { translate } from '@/utils';
import { useState } from 'react';
import { PasswordInput } from 'components/PasswordInput';
import { APIError } from '@/types';
import { Alert, AlertDescription, AlertTitle } from 'components/Alert';
import { useToast } from '@/hooks';

const FormSchema = z.object({
	password: z
		.string({
			required_error: translate('forms.required', {
				label: translate('profileSettings.password'),
			}),
		})
		.min(8, {
			message: translate('forms.min8.error', { label: translate('profileSettings.password') }),
		}),
	email: z
		.string({
			required_error: translate('forms.required', {
				label: translate('profileSettings.email'),
			}),
		})
		.email(translate('forms.email.error')),
});

export default function ChangeEmail() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<APIError | null>(null);
	const { toast } = useToast();

	const [isChangeMode, setIsChangeMode] = useState(false);
	const { user, changeEmail } = useAuthStore();
	const { t } = useTranslation();
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
	});

	async function onSubmit(data: z.infer<typeof FormSchema>) {
		try {
			setError(null);
			setLoading(true);
			await changeEmail(data.email, data.password);
			toast({
				action: 'success',
				title: t('profileSettings.email_updated_description') as string,
			});
			close();
		} catch (e) {
			setError(e as APIError);
		} finally {
			setLoading(false);
		}
	}

	function open() {
		form.reset();
		setIsChangeMode(true);
	}

	function close() {
		form.reset();
		setIsChangeMode(false);
	}

	return (
		<div className='space-y-4'>
			{isChangeMode ? (
				<Form {...form}>
					<form className='change-email-form' onSubmit={form.handleSubmit(onSubmit)}>
						{error && (
							<Alert variant='error'>
								<AlertTitle>{error.error}</AlertTitle>
								<AlertDescription>{error.details}</AlertDescription>
							</Alert>
						)}
						<FormField
							control={form.control}
							name='password'
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('profileSettings.password')}</FormLabel>
									<FormControl>
										<PasswordInput
											error={Boolean(form.formState.errors.password)}
											placeholder={t('profileSettings.password_placeholder') ?? ''}
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
							name='email'
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('profileSettings.email')}</FormLabel>
									<FormControl>
										<Input
											error={Boolean(form.formState.errors.email)}
											placeholder={t('profileSettings.new_email_placeholder') ?? ''}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className='mt-4 flex gap-4 justify-end'>
							<Button onClick={close} variant='text' size='lg'>
								{t('profileSettings.cancel')}
							</Button>
							<Button loading={loading} size='lg' type='submit'>
								{t('profileSettings.change_email')}
							</Button>
						</div>
					</form>
				</Form>
			) : (
				<div className='space-y-4'>
					<Input disabled readOnly value={user?.loginProfiles[0].email} />
					<Button onClick={open} size='lg' type='submit'>
						{t('profileSettings.change_email')}
					</Button>
				</div>
			)}
		</div>
	);
}
