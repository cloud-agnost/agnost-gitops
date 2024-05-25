import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/Form';
import { Input, Textarea } from '@/components/Input';
import { SettingsFormItem } from '@/components/SettingsFormItem';
import { Separator } from '@/components/Separator';
import { Switch } from '@/components/Switch';
import { t } from 'i18next';
import { Button } from '@/components/Button';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';
import { ModelSchema } from '@/types';
import { DrawerClose } from '@/components/Drawer';

export default function ModelForm({ editMode, loading }: { editMode?: boolean; loading: boolean }) {
	const form = useFormContext<z.infer<typeof ModelSchema>>();
	return (
		<>
			<FormField
				control={form.control}
				name='name'
				render={({ field, formState: { errors } }) => (
					<FormItem className='space-y-1'>
						<FormLabel>{t('database.models.add.name.field')}</FormLabel>
						<FormControl>
							<Input
								error={Boolean(errors.name)}
								type='text'
								placeholder={
									t('forms.placeholder', {
										label: t('database.models.add.name.field').toLowerCase(),
									}) as string
								}
								{...field}
							/>
						</FormControl>
						<FormDescription>{t('forms.max64.description')}</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<Separator />
			<FormField
				control={form.control}
				name='description'
				render={({ field }) => (
					<FormItem className='space-y-1'>
						<FormLabel>{t('database.models.add.description.field')}</FormLabel>
						<FormControl>
							<Textarea
								rows={4}
								placeholder={t('database.models.add.description.field').toString()}
								{...field}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<Separator />
			<FormField
				control={form.control}
				name='timestamps.enabled'
				render={({ field }) => (
					<FormItem className='space-y-1'>
						<FormControl>
							<SettingsFormItem
								twoColumns
								className='py-0'
								title={t('database.models.add.timestamps.enabled.field')}
								description={t('database.models.add.timestamps.enabled.desc')}
							>
								<Switch
									name={field.name}
									ref={field.ref}
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
							</SettingsFormItem>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			{form.watch('timestamps.enabled') && !editMode && (
				<>
					<Separator />
					<div className='grid grid-cols-2 gap-4'>
						<FormField
							control={form.control}
							name='timestamps.createdAt'
							render={({ field, formState: { errors } }) => (
								<FormItem className='space-y-1'>
									<FormLabel>{t('database.models.add.timestamps.createdAt.field')}</FormLabel>
									<FormControl>
										<Input
											error={Boolean(errors.timestamps?.createdAt)}
											type='text'
											readOnly={editMode && form.watch('timestamps.enabled')}
											placeholder={
												t('forms.placeholder', {
													label: t('database.models.add.timestamps.createdAt.field').toLowerCase(),
												}) as string
											}
											{...field}
										/>
									</FormControl>
									<FormDescription>{t('forms.max64.description')}</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='timestamps.updatedAt'
							render={({ field, formState: { errors } }) => (
								<FormItem className='space-y-1'>
									<FormLabel>{t('database.models.add.timestamps.updatedAt.field')}</FormLabel>
									<FormControl>
										<Input
											error={Boolean(errors.timestamps?.updatedAt)}
											type='text'
											readOnly={editMode && form.watch('timestamps.enabled')}
											placeholder={
												t('forms.placeholder', {
													label: t('database.models.add.timestamps.updatedAt.field').toLowerCase(),
												}) as string
											}
											{...field}
										/>
									</FormControl>
									<FormDescription>{t('forms.max64.description')}</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</>
			)}

			<div className='flex justify-end gap-4'>
				<DrawerClose asChild>
					<Button variant='secondary' size='lg'>
						{t('general.cancel')}
					</Button>
				</DrawerClose>
				<Button size='lg' loading={loading} type='submit'>
					{editMode ? t('general.save') : t('general.create')}
				</Button>
			</div>
		</>
	);
}
