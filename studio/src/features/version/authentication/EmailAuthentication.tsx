import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/Form';
import { Separator } from '@/components/Separator';
import { SettingsFormItem } from '@/components/SettingsFormItem';
import { Switch } from '@/components/Switch';
import { useAuthorizeVersion, useToast, useUpdateEffect } from '@/hooks';
import useSettingsStore from '@/store/version/settingsStore';
import useVersionStore from '@/store/version/versionStore';
import { APIError } from '@/types';
import { translate as t } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import EmailSmtpForm from './EmailSmtpForm';
export const EmailAuthenticationSchema = z
	.object({
		enabled: z.boolean().default(true),
		confirmEmail: z.boolean().default(false),
		expiresIn: z.coerce
			.number({
				required_error: t('forms.required', {
					label: t('version.authentication.link_expiry_duration'),
				}),
			})
			.int()
			.positive(),
		customSMTP: z.object({
			host: z.string().trim().optional(),
			port: z.coerce
				.number()
				.int()
				.positive()
				.min(100, 'Port must be at least 3 characters long')
				.optional(),
			user: z.string().trim().optional(),
			password: z.string().trim().optional(),
			useTLS: z.boolean(),
		}),
	})
	.superRefine((data, ctx) => {
		const { customSMTP, confirmEmail, enabled } = data;
		const { host, port, user, password } = customSMTP;
		if (confirmEmail && enabled) {
			if (!host) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Host is required',
					path: ['customSMTP', 'host'],
				});
			}
			if (!port) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Port is required',
					path: ['customSMTP', 'port'],
				});
			}
			if (!user) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Username is required',
					path: ['customSMTP', 'user'],
				});
			}
			if (!password) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Password is required',
					path: ['customSMTP', 'password'],
				});
			}
		}
	});

export default function EmailAuthentication() {
	const { toast } = useToast();
	const { saveEmailAuthSettings } = useSettingsStore();
	const { version } = useVersionStore();
	const canEdit = useAuthorizeVersion('version.auth.update');
	const form = useForm<z.infer<typeof EmailAuthenticationSchema>>({
		resolver: zodResolver(EmailAuthenticationSchema),
		defaultValues: version?.authentication?.email,
	});

	const { mutateAsync, isPending } = useMutation({
		mutationFn: saveEmailAuthSettings,
		mutationKey: ['saveEmailAuthSettings'],
		onSuccess: () => {
			toast({
				action: 'success',
				title: t('version.authentication.email_authentication_success'),
			});
		},
		onError: (error: APIError) => {
			toast({
				title: error.details,
				action: 'error',
			});
		},
	});
	function onSubmit(data: z.infer<typeof EmailAuthenticationSchema>) {
		mutateAsync({
			versionId: version._id,
			orgId: version.orgId,
			appId: version.appId,
			...data,
			confirmEmail: data.confirmEmail && data.enabled,
		});
	}

	useUpdateEffect(() => {
		if (version) {
			form.reset(version.authentication.email);
		}
	}, [version]);
	return (
		<SettingsFormItem
			className='py-0'
			contentClassName='p-4 border border-border rounded-lg space-y-4'
			title={t('version.authentication.email_authentication')}
			description={t('version.authentication.email_authentication_desc')}
		>
			<Form {...form}>
				<form
					className='space-y-6 flex flex-col'
					onSubmit={form.handleSubmit(onSubmit)}
					autoComplete='off'
				>
					<FormField
						control={form.control}
						name='enabled'
						render={({ field }) => (
							<FormItem className='flex justify-between gap-4 items-center space-y-0'>
								<FormLabel>{t('version.authentication.email_authentication_title')}</FormLabel>
								<FormControl>
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
										disabled={!canEdit}
									/>
								</FormControl>
							</FormItem>
						)}
					/>
					<Separator />
					{form.watch('enabled') && (
						<FormField
							control={form.control}
							name='confirmEmail'
							render={({ field }) => (
								<FormItem className='flex space-y-0 space-x-4'>
									<FormControl className='self-start'>
										<Checkbox
											disabled={!form.getValues('enabled') || !canEdit}
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<div className='space-y-2'>
										<FormLabel className='block'>
											{t('version.authentication.confirm_email')}
										</FormLabel>
										<FormLabel className='block text-subtle'>
											{t('version.authentication.confirm_email_desc')}
										</FormLabel>
										{form.watch('confirmEmail') && <EmailSmtpForm />}
									</div>
								</FormItem>
							)}
						/>
					)}

					<Button
						className='self-end'
						type='submit'
						variant='primary'
						size='lg'
						loading={isPending}
						disabled={!canEdit}
					>
						{t('general.save')}
					</Button>
				</form>
			</Form>
		</SettingsFormItem>
	);
}
