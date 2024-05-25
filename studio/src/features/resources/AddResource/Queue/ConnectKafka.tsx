import { Input } from '@/components/Input';
import { RadioGroup, RadioGroupItem } from '@/components/RadioGroup';
import { KAFKA_CONNECTION_SCHEMES } from '@/constants';
import { ConnectResourceSchema, KafkaConnFormat } from '@/types';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/Form';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import { ConnectKafkaWithSASL, ConnectKafkaWithSSL } from '@/features/resources';
import { Button } from '@/components/Button';
import { Plus, Trash } from '@phosphor-icons/react';
import { cn } from '@/utils';
import { isEmpty } from '@/utils';
import { useEffect } from 'react';
export default function ConnectKafka() {
	const form = useFormContext<z.infer<typeof ConnectResourceSchema>>();
	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'access.brokers',
	});
	const { t } = useTranslation();

	useEffect(() => {
		form.setValue('access.format', KafkaConnFormat.Simple);
	}, []);
	return (
		<>
			<FormField
				control={form.control}
				name='access.format'
				render={({ field }) => (
					<FormItem className='space-y-3'>
						<FormControl>
							<RadioGroup
								onValueChange={field.onChange}
								defaultValue={KAFKA_CONNECTION_SCHEMES[0].toLowerCase()}
								className='flex items-center gap-6 mb-8'
							>
								{KAFKA_CONNECTION_SCHEMES.map((type) => (
									<FormItem key={type} className='flex items-center space-x-3 space-y-0'>
										<FormControl>
											<RadioGroupItem value={type} />
										</FormControl>
										<FormLabel className='font-normal'>{t(`resources.queue.${type}`)}</FormLabel>
									</FormItem>
								))}
							</RadioGroup>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name='access.clientId'
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('resources.queue.clientId')}</FormLabel>
						<FormControl>
							<Input
								{...field}
								type='text'
								placeholder={
									t('forms.placeholder', {
										label: t('resources.queue.clientId'),
									}) as string
								}
								className='input'
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			{fields.map((f, index) => (
				<div className='flex gap-4' key={f.id}>
					<FormField
						control={form.control}
						name={`access.brokers.${index}.key`}
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
										error={!!form.formState.errors.access?.brokers?.[index]}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button
						variant='icon'
						size='sm'
						disabled={fields.length === 1}
						className={cn(
							'rounded-full',
							!index && 'self-end',
							!isEmpty(form.formState.errors) && !index && 'self-center mt-2',
							!isEmpty(form.formState.errors) &&
								isEmpty(form.formState.errors.access?.brokers?.[0]) &&
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
							append({ key: '' });
						}}
					>
						<Plus size={16} className='text-brand-primary' />
						<span className='text-brand-primary ml-2'>{t('resources.queue.addBroker')}</span>
					</Button>
				)}
			</div>
			{form.watch('access.format') === KafkaConnFormat.SSL && <ConnectKafkaWithSSL />}
			{form.watch('access.format') === KafkaConnFormat.SASL && <ConnectKafkaWithSASL />}
		</>
	);
}
