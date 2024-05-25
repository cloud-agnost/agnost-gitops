import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ConnectResourceSchema } from '@/types';
import { cn, isEmpty } from '@/utils';
import { Plus, Trash } from '@phosphor-icons/react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from 'components/Form';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';

export default function ConnectOptions() {
	const { t } = useTranslation();

	const {
		control,
		formState: { errors },
	} = useFormContext<z.infer<typeof ConnectResourceSchema>>();

	const { fields, append, remove } = useFieldArray({
		control,
		name: 'access.options',
	});

	return (
		<div className='space-y-4'>
			<h6 className=' font-sfCompact text-sm text-subtle '>
				{t('resources.database.connection_options')}
			</h6>
			{fields.map((f, index) => (
				<div className='flex gap-4' key={f.id}>
					<FormField
						control={control}
						name={`access.options.${index}.key`}
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
										error={!!errors.access?.options?.[index]?.key}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={control}
						name={`access.options.${index}.value`}
						render={({ field }) => (
							<FormItem className='flex-1'>
								{index === 0 && <FormLabel>{t('resources.database.value')}</FormLabel>}

								<Input
									placeholder={
										t('forms.placeholder', {
											label: t('resources.database.value'),
										}) ?? ''
									}
									error={!!errors.access?.options?.[index]?.value}
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
							!isEmpty(errors) && !index && 'self-center mt-2',
							!isEmpty(errors) && isEmpty(errors.access?.options?.[0]) && !index && 'self-end',
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
						<span className='text-brand-primary ml-2'>{t('general.add')}</span>
					</Button>
				)}
			</div>
		</div>
	);
}
