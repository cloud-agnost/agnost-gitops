import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/Form';
import { Input } from '@/components/Input';
import { ConnectResourceSchema } from '@/types';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';

export default function ConnectAzure() {
	const { t } = useTranslation();
	const form = useFormContext<z.infer<typeof ConnectResourceSchema>>();

	return (
		<FormField
			control={form.control}
			name='access.connectionString'
			render={({ field }) => (
				<FormItem className='flex-1'>
					<FormLabel>{t('resources.storage.azure.connectionString')}</FormLabel>
					<FormControl>
						<Input
							error={Boolean(form.formState.errors.access?.connectionString)}
							placeholder={
								t('forms.placeholder', {
									label: t('resources.storage.azure.connectionString'),
								}) ?? ''
							}
							{...field}
						/>
					</FormControl>

					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
