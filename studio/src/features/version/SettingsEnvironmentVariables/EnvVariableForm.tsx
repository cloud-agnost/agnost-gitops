import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/Form';
import { Input } from '@/components/Input';
import { t } from 'i18next';
import { Button } from '@/components/Button';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';
import { EnvVariableSchema } from '@/types';
import { DrawerClose } from '@/components/Drawer';

interface EnvVariableFormProps {
	loading: boolean;
}

export default function EnvVariableForm({ loading }: EnvVariableFormProps) {
	const form = useFormContext<z.infer<typeof EnvVariableSchema>>();

	return (
		<>
			<FormField
				control={form.control}
				name='name'
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('general.name')}</FormLabel>
						<FormControl>
							<Input
								error={Boolean(form.formState.errors.name)}
								placeholder={
									t('forms.placeholder', {
										label: t('general.name'),
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
				name='value'
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('general.value')}</FormLabel>
						<FormControl>
							<Input
								error={Boolean(form.formState.errors.value)}
								placeholder={
									t('forms.placeholder', {
										label: t('general.value'),
									}) ?? ''
								}
								{...field}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<div className='flex gap-4 justify-end mt-4'>
				<DrawerClose asChild>
					<Button variant='secondary' size='lg'>
						{t('general.cancel')}
					</Button>
				</DrawerClose>
				<Button loading={loading} size='lg' type='submit'>
					{t('general.save')}
				</Button>
			</div>
		</>
	);
}
