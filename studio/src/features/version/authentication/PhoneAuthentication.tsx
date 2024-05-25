import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import { Separator } from '@/components/Separator';
import { SettingsFormItem } from '@/components/SettingsFormItem';
import { Switch } from '@/components/Switch';
import { useAuthorizeVersion, useToast, useUpdateEffect } from '@/hooks';
import useTypeStore from '@/store/types/typeStore';
import useSettingsStore from '@/store/version/settingsStore';
import useVersionStore from '@/store/version/versionStore';
import { APIError, PhoneAuthSMSProviders } from '@/types';
import { translate as t } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const PhoneAuthSchema = z
	.object({
		enabled: z.boolean().default(true),
		confirmPhone: z.boolean().default(false),
		allowCodeSignIn: z.boolean().default(false),
		expiresIn: z.coerce
			.number({
				required_error: t('forms.required', {
					label: t('version.authentication.link_expiry_duration'),
				}),
			})
			.int()
			.positive(),
		smsProvider: z.nativeEnum(PhoneAuthSMSProviders).default(PhoneAuthSMSProviders.TWILIO),
		providerConfig: z
			.object({
				accountSID: z.string().optional(),
				authToken: z.string().optional(),
				fromNumberOrSID: z.string().optional(),
				accessKey: z.string().optional(),
				originator: z.string().optional(),
				apiKey: z.string().optional(),
				apiSecret: z.string().optional(),
				from: z.string().optional(),
			})
			.optional(),
	})
	.superRefine((val, ctx) => {
		const { smsProvider, providerConfig, confirmPhone, enabled } = val;

		if (!confirmPhone || !enabled) return;

		if (smsProvider === PhoneAuthSMSProviders.TWILIO && !providerConfig?.accountSID) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: t('forms.required', {
					label: t('version.authentication.accountSID'),
				}),
				path: ['providerConfig', 'accountSID'],
			});
		}
		if (smsProvider === PhoneAuthSMSProviders.TWILIO && !providerConfig?.authToken) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: t('forms.required', {
					label: t('version.authentication.authToken'),
				}),

				path: ['providerConfig', 'authToken'],
			});
		}
		if (smsProvider === PhoneAuthSMSProviders.TWILIO && !providerConfig?.fromNumberOrSID) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: t('forms.required', {
					label: t('version.authentication.fromNumberOrSID'),
				}),
				path: ['providerConfig', 'fromNumberOrSID'],
			});
		}
		if (smsProvider === PhoneAuthSMSProviders.MESSAGEBIRD && !providerConfig?.accessKey) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: t('forms.required', {
					label: t('version.authentication.accessKey'),
				}),
				path: ['providerConfig', 'accessKey'],
			});
		}
		if (smsProvider === PhoneAuthSMSProviders.MESSAGEBIRD && !providerConfig?.originator) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: t('forms.required', {
					label: t('version.authentication.originator'),
				}),
				path: ['providerConfig', 'originator'],
			});
		}
		if (smsProvider === PhoneAuthSMSProviders.VONAGE && !providerConfig?.apiKey) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: t('forms.required', {
					label: t('version.authentication.apiKey'),
				}),
				path: ['providerConfig', 'apiKey'],
			});
		}
		if (smsProvider === PhoneAuthSMSProviders.VONAGE && !providerConfig?.apiSecret) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: t('forms.required', {
					label: t('version.authentication.apiSecret'),
				}),
				path: ['providerConfig', 'apiSecret'],
			});
		}
		if (smsProvider === PhoneAuthSMSProviders.VONAGE && !providerConfig?.from) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: t('forms.required', {
					label: t('version.authentication.from'),
				}),
				path: ['providerConfig', 'from'],
			});
		}
	});

export default function PhoneAuthentication() {
	const { toast } = useToast();
	const { version } = useVersionStore();
	const { savePhoneAuthSettings } = useSettingsStore();
	const { phoneAuthSMSProviders } = useTypeStore();
	const canEdit = useAuthorizeVersion('version.auth.update');

	const form = useForm<z.infer<typeof PhoneAuthSchema>>({
		resolver: zodResolver(PhoneAuthSchema),
		defaultValues: version?.authentication?.phone,
	});
	const selectedProvider = phoneAuthSMSProviders.find(
		(p) => p.provider === form.watch('smsProvider'),
	);
	const { mutateAsync, isPending } = useMutation({
		mutationFn: savePhoneAuthSettings,
		mutationKey: ['savePhoneAuthSettings'],
		onSuccess: () => {
			toast({
				action: 'success',
				title: t('version.authentication.phone_authentication_success'),
			});
		},
		onError: (error: APIError) => {
			toast({
				title: error.details,
				action: 'error',
			});
		},
	});
	function onSubmit(data: z.infer<typeof PhoneAuthSchema>) {
		mutateAsync({
			versionId: version._id,
			orgId: version.orgId,
			appId: version.appId,
			...data,
		});
	}
	useUpdateEffect(() => {
		if (version) {
			form.reset(version.authentication.phone);
		}
	}, [version]);
	return (
		<SettingsFormItem
			className='py-0'
			contentClassName='p-4 border border-border rounded-lg space-y-4'
			title={t('version.authentication.mobile_authentication')}
			description={t('version.authentication.mobile_authentication_desc')}
		>
			<Form {...form}>
				<form className='space-y-6 flex flex-col' onSubmit={form.handleSubmit(onSubmit)}>
					<FormField
						control={form.control}
						name='enabled'
						render={({ field }) => (
							<FormItem className='flex justify-between gap-4 items-center space-y-0'>
								<FormLabel>{t('version.authentication.mobile_authentication_title')}</FormLabel>

								<FormControl>
									<Switch checked={field.value} onCheckedChange={field.onChange} />
								</FormControl>
							</FormItem>
						)}
					/>

					<Separator />
					{form.watch('enabled') && (
						<>
							<FormField
								control={form.control}
								name='confirmPhone'
								render={({ field }) => (
									<FormItem className='flex space-y-0 space-x-4'>
										<FormControl>
											<Checkbox
												disabled={!form.getValues('enabled')}
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<div className='space-y-2'>
											<FormLabel className='block'>
												{t('version.authentication.confirm_mobile')}
											</FormLabel>
											<FormLabel className='block text-subtle'>
												{t('version.authentication.confirm_mobile_desc')}
											</FormLabel>
										</div>
									</FormItem>
								)}
							/>
							{form.watch('confirmPhone') && (
								<FormField
									control={form.control}
									name='allowCodeSignIn'
									render={({ field }) => (
										<FormItem className='flex space-y-0 space-x-4'>
											<FormControl className='self-start'>
												<Checkbox
													disabled={!form.getValues('enabled')}
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
											<div className='space-y-4'>
												<FormLabel className='block'>
													{t('version.authentication.allow_signin_codes')}
												</FormLabel>
												<FormLabel className='block text-subtle'>
													{t('version.authentication.allow_signin_codes_desc')}
												</FormLabel>
												{form.watch('confirmPhone') && (
													<>
														<FormField
															control={form.control}
															name='expiresIn'
															render={({ field }) => {
																return (
																	<FormItem>
																		<FormLabel>
																			{t('version.authentication.link_expiry_duration')}
																		</FormLabel>
																		<FormControl>
																			<Input
																				type='number'
																				error={!!form.formState.errors.expiresIn}
																				placeholder={
																					t('forms.placeholder', {
																						label: t('version.authentication.link_expiry_duration'),
																					}) ?? ''
																				}
																				{...field}
																			/>
																		</FormControl>
																		<FormDescription>
																			{t('version.authentication.link_expiry_duration_desc')}
																		</FormDescription>
																		<FormMessage />
																	</FormItem>
																);
															}}
														/>
														<FormField
															control={form.control}
															name='smsProvider'
															render={({ field }) => (
																<FormItem>
																	<FormLabel>
																		{t('version.authentication.select_sms_provider')}{' '}
																	</FormLabel>
																	<Select defaultValue={field.value} onValueChange={field.onChange}>
																		<FormControl>
																			<SelectTrigger className='w-full'>
																				<SelectValue
																					placeholder={t('version.authentication.select_provider')}
																				/>
																			</SelectTrigger>
																		</FormControl>
																		<SelectContent>
																			{phoneAuthSMSProviders.map((p) => (
																				<SelectItem
																					key={p.provider}
																					value={p.provider}
																					className='max-w-full'
																				>
																					{p.provider}
																				</SelectItem>
																			))}
																		</SelectContent>
																	</Select>

																	<FormMessage />
																</FormItem>
															)}
														/>
														{selectedProvider?.params.map((p) => (
															<FormField
																key={p.name}
																control={form.control}
																name={`providerConfig.${p.name}`}
																render={({ field }) => {
																	return (
																		<FormItem>
																			<FormLabel>{p.title}</FormLabel>
																			<FormControl>
																				<Input
																					error={!!form.formState.errors?.providerConfig?.[p.name]}
																					placeholder={
																						t('forms.placeholder', {
																							label: p.title,
																						}) ?? ''
																					}
																					{...field}
																				/>
																			</FormControl>
																			<FormDescription>{p.description}</FormDescription>
																			<FormMessage />
																		</FormItem>
																	);
																}}
															/>
														))}
													</>
												)}
											</div>
										</FormItem>
									)}
								/>
							)}
						</>
					)}

					<Button
						size='lg'
						className='self-end'
						type='submit'
						variant='primary'
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
