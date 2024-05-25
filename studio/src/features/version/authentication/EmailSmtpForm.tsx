import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/Form';
import { Input } from '@/components/Input';
import { PasswordInput } from '@/components/PasswordInput';
import { EmailAuthenticationSchema } from './EmailAuthentication';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import * as z from 'zod';
import { Switch } from '@/components/Switch';
import { useAuthorizeVersion } from '@/hooks';
export default function EmailSmtpForm() {
	const { t } = useTranslation();
	const form = useFormContext<z.infer<typeof EmailAuthenticationSchema>>();
	const canEdit = useAuthorizeVersion('version.auth.update');
	return (
		<>
			<FormField
				control={form.control}
				name='expiresIn'
				render={({ field }) => {
					return (
						<FormItem>
							<FormLabel>{t('version.authentication.link_expiry_duration')}</FormLabel>
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
				name='customSMTP.host'
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('onboarding.smtp.host')}</FormLabel>
						<FormControl>
							<Input
								error={!!form.formState.errors.customSMTP?.host}
								placeholder={t('onboarding.smtp.enter_host').toString()}
								{...field}
							/>
						</FormControl>
						<FormDescription>{t('onboarding.smtp.host_desc')}</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name='customSMTP.port'
				render={({ field }) => {
					return (
						<FormItem>
							<FormLabel>{t('onboarding.smtp.port')}</FormLabel>
							<FormControl>
								<Input
									type='number'
									error={!!form.formState.errors.customSMTP?.port}
									placeholder={t('onboarding.smtp.enter_port').toString()}
									{...field}
								/>
							</FormControl>
							<FormDescription>{t('onboarding.smtp.port_desc')}</FormDescription>
							<FormMessage />
						</FormItem>
					);
				}}
			/>
			<FormField
				control={form.control}
				name='customSMTP.user'
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('onboarding.smtp.username')}</FormLabel>
						<FormControl>
							<Input
								error={!!form.formState.errors.customSMTP?.user}
								placeholder={t('onboarding.smtp.enter_username').toString()}
								{...field}
							/>
						</FormControl>
						<FormDescription>{t('onboarding.smtp.username_desc')}</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name='customSMTP.password'
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('onboarding.smtp.password')}</FormLabel>
						<FormControl>
							<PasswordInput
								error={Boolean(form.formState.errors.customSMTP?.password)}
								type='password'
								placeholder={t('onboarding.smtp.enter_password').toString()}
								disableShowPassword={!canEdit}
								{...field}
							/>
						</FormControl>
						<FormDescription>{t('onboarding.smtp.password_desc')}</FormDescription>

						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name='customSMTP.useTLS'
				render={({ field }) => {
					return (
						<FormItem className='flex items-center gap-2'>
							<FormLabel>{t('onboarding.smtp.useTLS')}</FormLabel>
							<FormControl>
								<Switch
									className='flex !m-0'
									onBlur={field.onBlur}
									ref={field.ref}
									name={field.name}
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					);
				}}
			/>
		</>
	);
}
