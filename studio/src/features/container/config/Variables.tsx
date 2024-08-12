import { Button } from '@/components/Button';
import { Description } from '@/components/Description';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/Form';
import { Input } from '@/components/Input';
import { PasswordInput } from '@/components/PasswordInput';
import useContainerStore from '@/store/container/containerStore';
import { CreateContainerParams } from '@/types';
import { cn } from '@/utils';
import { Plus, Trash } from '@phosphor-icons/react';
import { isEmpty } from 'lodash';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
export default function Variables() {
	const form = useFormContext<CreateContainerParams>();
	const { template } = useContainerStore();
	const { t } = useTranslation();
	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'variables',
	});
	return (
		<>
			<Description title={t('container.env.title')}>{t('container.env.description')}</Description>
			<div className='space-y-8'>
				{fields.map((f, index) => (
					<div className='flex gap-4' key={f.id}>
						<FormField
							control={form.control}
							name={`variables.${index}.name`}
							render={({ field }) => (
								<FormItem className='flex-1'>
									{index === 0 && <FormLabel>{t('general.key')}</FormLabel>}
									<FormControl>
										<Input
											disabled={!!template}
											placeholder={
												t('forms.placeholder', {
													label: t('general.key'),
												}) ?? ''
											}
											error={!!form.formState.errors.variables?.[index]?.name}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name={`variables.${index}.value`}
							render={({ field }) => (
								<FormItem className='flex-1'>
									{index === 0 && <FormLabel>{t('general.value')}</FormLabel>}

									<PasswordInput
										disabled={!!template}
										copyable
										placeholder={
											t('forms.placeholder', {
												label: t('general.value'),
											}) ?? ''
										}
										error={!!form.formState.errors.variables?.[index]?.name}
										{...field}
									/>
									<FormMessage />
								</FormItem>
							)}
						/>
						{!template && (
							<Button
								variant='icon'
								size='sm'
								className={cn(
									'rounded-full',
									!index && 'self-end',
									!isEmpty(form.formState.errors) && !index && 'self-center mt-2',
									!isEmpty(form.formState.errors) &&
										isEmpty(form.formState.errors.variables?.[0]) &&
										!index &&
										'self-end',
								)}
								onClick={() => {
									remove(index);
								}}
							>
								<Trash size={16} className='text-subtle' />
							</Button>
						)}
					</div>
				))}
				{!template && (
					<div className='flex justify-between items-center mt-8'>
						{fields.length < 50 && (
							<Button
								variant='text'
								onClick={() => {
									append({ name: '', value: '' });
								}}
							>
								<Plus size={16} className='text-brand-primary' />
								<span className='text-brand-primary ml-2'>{t('container.add_variable')}</span>
							</Button>
						)}
					</div>
				)}
			</div>
		</>
	);
}
