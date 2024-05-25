import { Input } from '@/components/Input';
import { PasswordInput } from '@/components/PasswordInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import { RABBITMQ_CONNECTION_SCHEMES } from '@/constants';
import { ConnectResourceSchema } from '@/types';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from 'components/Form';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import { ConnectOptions } from '@/features/resources';
export default function ConnectRabbitMqWithObject() {
	const { t } = useTranslation();
	const form = useFormContext<z.infer<typeof ConnectResourceSchema>>();

	return (
		<div className='flex flex-col gap-2'>
			<div className='space-y-6'>
				<div className='flex gap-6'>
					<FormField
						control={form.control}
						name='access.scheme'
						render={({ field }) => (
							<FormItem className='flex-1'>
								<FormLabel>{t('resources.queue.scheme')}</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value}>
									<FormControl>
										<SelectTrigger className='w-full bg-input-background'>
											<SelectValue
												placeholder={
													t('forms.select', {
														label: t('resources.queue.scheme'),
													}) ?? ''
												}
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{RABBITMQ_CONNECTION_SCHEMES.map((scheme) => (
											<SelectItem key={scheme} value={scheme}>
												{scheme}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name='access.vhost'
						render={({ field }) => (
							<FormItem className='flex-1'>
								<FormLabel>{t('resources.queue.vhost')}</FormLabel>
								<FormControl>
									<Input
										error={Boolean(form.formState.errors?.access?.vhost)}
										placeholder={
											t('forms.placeholder', {
												label: t('resources.queue.vhost'),
											}) ?? ''
										}
										{...field}
									/>
								</FormControl>

								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<div className='flex gap-6'>
					<FormField
						control={form.control}
						name='access.host'
						render={({ field }) => (
							<FormItem className='flex-1'>
								<FormLabel>{t('resources.queue.host')}</FormLabel>
								<FormControl>
									<Input
										error={Boolean(form.formState.errors?.access?.host)}
										placeholder={
											t('forms.placeholder', {
												label: t('resources.queue.host'),
											}) ?? ''
										}
										{...field}
									/>
								</FormControl>

								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name='access.port'
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t('resources.queue.port')}</FormLabel>
								<FormControl>
									<Input
										error={Boolean(form.formState.errors?.access?.port)}
										placeholder={
											t('forms.placeholder', {
												label: t('resources.queue.port'),
											}) ?? ''
										}
										{...field}
									/>
								</FormControl>

								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className='flex items-start gap-6'>
					<FormField
						control={form.control}
						name='access.username'
						render={({ field }) => (
							<FormItem className='flex-1'>
								<FormLabel>{t('resources.queue.username')}</FormLabel>
								<FormControl>
									<Input
										error={Boolean(form.formState.errors?.access?.username)}
										placeholder={
											t('forms.placeholder', {
												label: t('resources.queue.username'),
											}) ?? ''
										}
										{...field}
									/>
								</FormControl>

								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name='access.password'
						render={({ field }) => (
							<FormItem className='flex-1'>
								<FormLabel>{t('resources.queue.password')}</FormLabel>
								<FormControl>
									<PasswordInput
										error={Boolean(form.formState.errors?.access?.password)}
										placeholder={
											t('forms.placeholder', {
												label: t('resources.queue.password'),
											}) ?? ''
										}
										{...field}
									/>
								</FormControl>

								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<ConnectOptions />
			</div>
		</div>
	);
}
