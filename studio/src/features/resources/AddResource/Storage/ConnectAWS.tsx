import { Input } from '@/components/Input';
import { ConnectResourceSchema } from '@/types';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from 'components/Form';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';

export default function ConnectAWS() {
	const form = useFormContext<z.infer<typeof ConnectResourceSchema>>();
	const { t } = useTranslation();
	return (
		<div className='grid grid-cols-2 grid-rows-2 gap-6'>
			<FormField
				control={form.control}
				name='access.accessKeyId'
				render={({ field }) => (
					<FormItem className='flex-1'>
						<FormLabel>{t('resources.storage.aws.accessKeyId')}</FormLabel>
						<FormControl>
							<Input
								error={Boolean(form.formState.errors.access?.accessKeyId)}
								placeholder={
									t('forms.placeholder', {
										label: t('resources.storage.aws.accessKeyId'),
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
				name='access.secretAccessKey'
				render={({ field }) => (
					<FormItem className='flex-1'>
						<FormLabel>{t('resources.storage.aws.secret')}</FormLabel>
						<FormControl>
							<Input
								error={Boolean(form.formState.errors.access?.secretAccessKey)}
								placeholder={
									t('forms.placeholder', {
										label: t('resources.storage.aws.secret'),
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
				name='access.region'
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('resources.storage.aws.region')}</FormLabel>
						<FormControl>
							<Input
								error={Boolean(form.formState.errors.access?.region)}
								placeholder={
									t('forms.placeholder', {
										label: t('resources.storage.aws.region'),
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
	);
}
