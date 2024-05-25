import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/Form';
import { Input } from '@/components/Input';
import { CreateContainerParams } from '@/types/container';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export default function RegistryForm() {
	const form = useFormContext<CreateContainerParams>();
	const { t } = useTranslation();
	return (
		<div className='space-y-4'>
			<FormField
				control={form.control}
				name='registry.image'
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('container.registry.id')}</FormLabel>
						<FormControl>
							<Input
								error={Boolean(form.formState.errors.registry?.registryId)}
								placeholder={
									t('forms.placeholder', {
										label: t('container.registry.id'),
									}) ?? ''
								}
								{...field}
							/>
						</FormControl>
						<FormDescription>{t('container.registry.id_help')}</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name='registry.registryId'
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('container.registry.image')}</FormLabel>
						<FormControl>
							<Input
								error={Boolean(form.formState.errors.registry?.image)}
								placeholder={
									t('forms.placeholder', {
										label: t('container.registry.image'),
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
