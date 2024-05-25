import { Button } from '@/components/Button';
import { DrawerClose, DrawerFooter } from '@/components/Drawer';
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/Form';
import { Input } from '@/components/Input';
import { Switch } from '@/components/Switch';
import { BucketSchema } from '@/types';
import { cn, isEmpty } from '@/utils';
import { Plus, Trash } from '@phosphor-icons/react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
export default function BucketForm({ loading }: { loading: boolean }) {
	const form = useFormContext<z.infer<typeof BucketSchema>>();
	const { t } = useTranslation();
	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'tags',
	});
	return (
		<div className='space-y-6'>
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
						<FormDescription>{t('forms.max64.description')}</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<div className='space-y-4'>
				<FormLabel>
					<p>{t('storage.bucket.tags')}</p>
				</FormLabel>
				{fields.map((f, index) => (
					<div className='flex gap-4' key={f.id}>
						<FormField
							control={form.control}
							name={`tags.${index}.key`}
							render={({ field }) => (
								<FormItem className='flex-1'>
									{index === 0 && <FormLabel>{t('resources.database.key')}</FormLabel>}
									<FormControl>
										<Input
											placeholder={
												t('forms.placeholder', {
													label: t('resources.database.key'),
												}) ?? ''
											}
											error={!!form.formState.errors.tags?.[index]?.key}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name={`tags.${index}.value`}
							render={({ field }) => (
								<FormItem className='flex-1'>
									{index === 0 && <FormLabel>{t('resources.database.value')}</FormLabel>}

									<Input
										placeholder={
											t('forms.placeholder', {
												label: t('resources.database.value'),
											}) ?? ''
										}
										error={!!form.formState.errors.tags?.[index]?.value}
										{...field}
									/>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button
							variant='icon'
							size='sm'
							className={cn(
								'rounded-full',
								!index && 'self-end',
								!isEmpty(form.formState.errors) && !index && 'self-center mt-2',
								!isEmpty(form.formState.errors) &&
									isEmpty(form.formState.errors.tags?.[0]) &&
									!index &&
									'self-end',
							)}
							onClick={() => {
								remove(index);
							}}
						>
							<Trash size={16} className='text-subtle' />
						</Button>
					</div>
				))}
				<div className='flex justify-between items-center mt-8'>
					{fields.length < 50 && (
						<Button
							variant='text'
							onClick={() => {
								append({ key: '', value: '' });
							}}
						>
							<Plus size={16} className='text-brand-primary' />
							<span className='text-brand-primary ml-2'>{t('general.add_another_one')}</span>
						</Button>
					)}
				</div>
			</div>

			<FormField
				control={form.control}
				name='isPublic'
				render={({ field }) => (
					<FormItem className='flex justify-between gap-4 items-center space-y-0'>
						<FormLabel>
							<p>{t('storage.bucket.visibility.title')}</p>
							<p className='text-subtle'>{t('storage.bucket.visibility.desc')}</p>
						</FormLabel>
						<FormControl>
							<Switch checked={field.value} onCheckedChange={field.onChange} />
						</FormControl>
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
					<Button className='ml-2' type='submit' size='lg' loading={loading}>
						{t('general.save')}
					</Button>
				</div>
			</DrawerFooter>
		</div>
	);
}
