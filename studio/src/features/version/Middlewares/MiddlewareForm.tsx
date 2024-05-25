import { MiddlewareSchema } from '@/types';
import { Button } from '@/components/Button';
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
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { DrawerClose, DrawerFooter } from '@/components/Drawer';
export default function MiddlewareForm({
	loading,
	onSubmit,
}: {
	loading: boolean;
	onSubmit: (data: z.infer<typeof MiddlewareSchema>) => void;
}) {
	const { t } = useTranslation();
	const form = useFormContext<z.infer<typeof MiddlewareSchema>>();
	return (
		<>
			<FormField
				control={form.control}
				name='name'
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('version.middleware.name')}</FormLabel>
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
			<DrawerFooter className='mt-8'>
				<div className='flex justify-end'>
					<DrawerClose asChild>
						<Button variant='secondary' size='lg'>
							{t('general.cancel')}
						</Button>
					</DrawerClose>

					<Button
						className='ml-2'
						type='button'
						size='lg'
						loading={loading}
						onClick={() => form.handleSubmit(onSubmit)()}
					>
						{t('general.save')}
					</Button>
				</div>
			</DrawerFooter>
		</>
	);
}
