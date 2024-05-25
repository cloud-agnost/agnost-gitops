import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/Form';
import { SMTPSchema } from '@/types';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import { Input } from '../Input';
import { PasswordInput } from '../PasswordInput';
import { Switch } from '../Switch';
export default function SMTPForm() {
	const { t } = useTranslation();
	const form = useFormContext<z.infer<typeof SMTPSchema>>();
	return (
		<>
			<FormField
				control={form.control}
				name='fromName'
				render={({ field }) => (
					<FormItem className='flex-1'>
						<FormLabel>{t('onboarding.smtp.fromName')}</FormLabel>
						<FormControl>
							<Input
								error={!!form.formState.errors.host}
								placeholder={t('onboarding.smtp.enter_fromName').toString()}
								{...field}
							/>
						</FormControl>
						<FormDescription>{t('onboarding.smtp.fromName_desc')}</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name='fromEmail'
				render={({ field }) => (
					<FormItem className='flex-1'>
						<FormLabel>{t('onboarding.smtp.fromEmail')}</FormLabel>
						<FormControl>
							<Input
								error={!!form.formState.errors.host}
								placeholder={t('onboarding.smtp.enter_fromEmail').toString()}
								{...field}
							/>
						</FormControl>
						<FormDescription>{t('onboarding.smtp.fromEmail_desc')}</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name='host'
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('onboarding.smtp.host')}</FormLabel>
						<FormControl>
							<Input
								error={!!form.formState.errors.host}
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
				name='port'
				render={({ field }) => {
					return (
						<FormItem>
							<FormLabel>{t('onboarding.smtp.port')}</FormLabel>
							<FormControl>
								<Input
									type='number'
									error={!!form.formState.errors.port}
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
				name='user'
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('onboarding.smtp.username')}</FormLabel>
						<FormControl>
							<Input
								error={!!form.formState.errors.user}
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
				name='password'
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('onboarding.smtp.password')}</FormLabel>
						<FormControl>
							<PasswordInput
								error={Boolean(form.formState.errors.password)}
								type='password'
								placeholder={t('onboarding.smtp.enter_password').toString()}
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
				name='useTLS'
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
