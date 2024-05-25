import { FormControl, FormField, FormItem, FormLabel, FormMessage } from 'components/Form';
import { Button } from '@/components/Button';
import * as z from 'zod';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Input } from 'components/Input';
import { cn, isEmpty } from '@/utils';
import { Plus, Trash } from '@phosphor-icons/react';
import { Schema } from '@/features/version/SettingsAPIKeys';
import { RadioGroup, RadioGroupItem } from 'components/RadioGroup';
import { AUTHORIZATION_OPTIONS } from '@/constants';
import { useEffect } from 'react';

export default function AddOrEditAPIKeyAllowedIPs() {
	const { t } = useTranslation();
	const form = useFormContext<z.infer<typeof Schema>>();
	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'ip.list',
	});

	const hasAtLestOneError = !!form.formState.errors.ip?.message;
	const atLestOneError = form.formState.errors.ip?.message as string;

	useEffect(() => {
		if (form.getValues('ip.type') === 'specified' && isEmpty(fields)) {
			append({ ip: '' });
		}
	}, [form.getValues('ip.type')]);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className='p-6 flex flex-col gap-6'
		>
			<FormField
				control={form.control}
				name='ip.type'
				render={({ field }) => (
					<FormItem className='flex-1'>
						<FormLabel>{t('version.api_key.authorized_ips')}</FormLabel>
						<FormControl>
							<RadioGroup
								onValueChange={field.onChange}
								defaultValue={field.value}
								className='flex flex-col gap-y-6'
							>
								{AUTHORIZATION_OPTIONS.map((item, index) => (
									<FormItem className='flex space-x-3 space-y-0' key={index}>
										<FormControl className='mt-1'>
											<RadioGroupItem value={item} />
										</FormControl>
										<FormLabel className='select-none cursor-pointer'>
											<p className='text-default'>{t(`version.api_key.${item}_ips`)}</p>
											<p className='text-subtle'>{t(`version.api_key.${item}_ips_desc`)}</p>
										</FormLabel>
									</FormItem>
								))}
							</RadioGroup>
						</FormControl>
					</FormItem>
				)}
			/>
			<div className='flex flex-col gap-2'>
				{form.getValues('ip.type') === 'specified' &&
					fields.map((field, index) => {
						const last = index === fields.length - 1;
						return (
							<div className='flex gap-2' key={field.id}>
								<FormField
									control={form.control}
									name={`ip.list.${index}.ip`}
									render={({ field }) => {
										return (
											<FormItem className='flex-1'>
												{index === 0 && <FormLabel>{t('general.IP')}</FormLabel>}
												<FormControl>
													<Input
														placeholder={
															t('forms.placeholder', {
																label: t('general.IP'),
															}) ?? ''
														}
														error={
															(last && hasAtLestOneError) ||
															!!form.formState.errors.ip?.list?.[index]?.ip
														}
														{...field}
													/>
												</FormControl>
												{last && hasAtLestOneError ? (
													<FormMessage>{atLestOneError}</FormMessage>
												) : (
													<FormMessage />
												)}
											</FormItem>
										);
									}}
								/>

								<Button
									variant='secondary'
									disabled={fields.length === 1}
									className={cn(
										fields.length === 1 && !isEmpty(atLestOneError)
											? 'self-center mt-2'
											: index === 0 && !isEmpty(form.formState.errors.ip?.list?.[index])
											  ? 'self-center mt-2'
											  : index === 0 && 'self-end',
										index !== 0 &&
											!isEmpty(form.formState.errors.ip?.list?.[index]) &&
											'self-start',
									)}
									onClick={() => {
										remove(index);
									}}
								>
									<Trash size={16} className='text-subtle' />
								</Button>
							</div>
						);
					})}
			</div>
			{form.getValues('ip.type') === 'specified' && (
				<div>
					<Button
						variant='text'
						onClick={() => {
							append({ ip: '' });
						}}
					>
						<Plus size={16} />
						<span className='ml-2'>Add Another One</span>
					</Button>
				</div>
			)}
		</motion.div>
	);
}
