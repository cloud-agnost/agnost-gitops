import { Button } from '@/components/Button';
import { APIError, ChangeNameFormSchema } from '@/types';
import { Alert, AlertDescription, AlertTitle } from 'components/Alert';
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from 'components/Form';
import { Input } from 'components/Input';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';

interface ChangeNameFormProps {
	error: APIError | null;
	loading: boolean;
	label?: string;
	disabled?: boolean;
}

export default function ChangeNameForm({ error, loading, label, disabled }: ChangeNameFormProps) {
	const { t } = useTranslation();

	const form = useFormContext<z.infer<typeof ChangeNameFormSchema>>();
	return (
		<div className='space-y-4'>
			{error && (
				<Alert variant='error'>
					<AlertTitle>{error.error}</AlertTitle>
					<AlertDescription>{error.details}</AlertDescription>
				</Alert>
			)}

			<FormField
				control={form.control}
				name='name'
				render={({ field }) => (
					<FormItem>
						{label && <FormLabel>{label}</FormLabel>}
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
						<FormDescription>{t('forms.max64.description')}</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<div className='mt-4'>
				<Button loading={loading} size='lg' disabled={disabled} type='submit'>
					{t('general.save')}
				</Button>
			</div>
		</div>
	);
}
