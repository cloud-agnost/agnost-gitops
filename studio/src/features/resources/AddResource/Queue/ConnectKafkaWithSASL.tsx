import { Input } from '@/components/Input';
import { PasswordInput } from '@/components/PasswordInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import { KAFKA_SASL_MECHANISM } from '@/constants';
import { ConnectResourceSchema } from '@/types';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/Form';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';

export default function ConnectKafkaWithSASL() {
	const form = useFormContext<z.infer<typeof ConnectResourceSchema>>();
	const { t } = useTranslation();
	return (
		<>
			<FormField
				control={form.control}
				name='access.sasl.mechanism'
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('resources.queue.scheme')}</FormLabel>
						<Select onValueChange={field.onChange} defaultValue={field.value}>
							<FormControl>
								<SelectTrigger className='w-[calc(50%-0.75rem)] bg-input-background mr-6'>
									<SelectValue
										placeholder={
											t('forms.select', {
												label: t('resources.queue.scheme'),
											}) ?? ''
										}
									/>
								</SelectTrigger>
							</FormControl>
							<SelectContent className='w-full'>
								{KAFKA_SASL_MECHANISM.map((scheme) => (
									<SelectItem key={scheme} value={scheme} className='max-w-full'>
										{t(`resources.queue.${scheme}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<FormMessage />
					</FormItem>
				)}
			/>
			<div className='flex items-start gap-6'>
				<FormField
					control={form.control}
					name='access.sasl.username'
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
					name='access.sasl.password'
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
		</>
	);
}
