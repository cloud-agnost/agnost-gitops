import { Input } from '@/components/Input';
import { Textarea } from '@/components/Input/Textarea';
import { ConnectResourceSchema } from '@/types';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/Form';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';

export default function ConnectGCP() {
	const form = useFormContext<z.infer<typeof ConnectResourceSchema>>();
	const { t } = useTranslation();
	return (
		<div className='space-y-6'>
			<FormField
				control={form.control}
				name='access.projectId'
				render={({ field }) => (
					<FormItem className='flex-1'>
						<FormLabel>{t('resources.storage.gcp.projectId')}</FormLabel>
						<FormControl>
							<Input
								error={Boolean(form.formState.errors.access?.projectId)}
								placeholder={
									t('forms.placeholder', {
										label: t('resources.storage.gcp.projectId'),
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
				name='access.keyFileContents'
				render={({ field }) => (
					<FormItem className='flex-1'>
						<FormLabel>{t('resources.storage.gcp.keyFileContents')}</FormLabel>
						<FormControl>
							<Textarea
								showCount
								rows={15}
								error={Boolean(form.formState.errors.access?.keyFileContents)}
								placeholder={
									t('forms.placeholder', {
										label: t('resources.storage.gcp.keyFileContents'),
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
