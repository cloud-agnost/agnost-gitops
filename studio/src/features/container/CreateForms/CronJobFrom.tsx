import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/Form';
import { Input } from '@/components/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import CronExamples from '@/features/task/CronExamples';
import useTypeStore from '@/store/types/typeStore';
import { CreateContainerParams } from '@/types/container';
import { IdentificationCard } from '@phosphor-icons/react';
import { Switch } from '@/components/Switch';
import { startCase } from 'lodash';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import MultiSelect from 'react-select';
import { PodConfiguration, SourceConfig, StorageConfig } from '../config';
import ContainerFormTitle from '../config/ContainerFormLayout';
import { useEffect } from 'react';
import { CRON_EXAMPLES } from '@/constants';

export default function CronJobFrom() {
	const { t } = useTranslation();
	const form = useFormContext<CreateContainerParams>();
	const { timezones } = useTypeStore();

	useEffect(() => {
		form.setValue('cronJobConfig.timeZone', 'UTC');
		form.setValue('cronJobConfig.concurrencyPolicy', 'Allow');
		form.setValue('cronJobConfig.suspend', false);
	}, [form]);

	return (
		<>
			<ContainerFormTitle
				title={t('container.general')}
				descriptionI18nKey='container.cronjob.description'
				icon={<IdentificationCard size={20} />}
			>
				<div className='grid grid-cols-2 gap-4'>
					<FormField
						control={form.control}
						name='name'
						render={({ field }) => (
							<FormItem className='flex-1'>
								<FormLabel>{t('container.cronjob.name')}</FormLabel>
								<FormControl>
									<Input
										error={Boolean(form.formState.errors.name)}
										placeholder={
											t('forms.placeholder', {
												label: t('container.cronjob.name'),
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
					<FormField
						control={form.control}
						name='cronJobConfig.concurrencyPolicy'
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t('container.cronjob.concurrency')}</FormLabel>
								<Select
									defaultValue={field.value}
									value={field.value}
									onValueChange={field.onChange}
								>
									<FormControl>
										<SelectTrigger className='w-full'>
											<SelectValue>{startCase(field.value)}</SelectValue>
										</SelectTrigger>
									</FormControl>
									<SelectContent className=' max-w-xs'>
										<div className='space-y-2'>
											{['Allow', 'Forbid', 'Replace'].map((policy) => (
												<SelectItem key={policy} value={policy}>
													{startCase(policy)}
													<p className='text-xs text-subtle text-pretty max-w-[90ch]'>
														{t(`container.cronjob.${policy}`)}
													</p>
												</SelectItem>
											))}
										</div>
									</SelectContent>
								</Select>

								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<div className='grid grid-cols-[2fr_1fr] gap-4'>
					<FormField
						control={form.control}
						name='cronJobConfig.schedule'
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t('container.cronjob.schedule')}</FormLabel>
								<CronExamples
									selectCron={(cron: string) => form.setValue('cronJobConfig.schedule', cron)}
								>
									<FormControl>
										<Input
											error={Boolean(form.formState.errors.cronJobConfig?.schedule)}
											placeholder={CRON_EXAMPLES[1]}
											{...field}
										/>
									</FormControl>
								</CronExamples>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name='cronJobConfig.timeZone'
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t('container.cronjob.timezone')}</FormLabel>
								<FormControl>
									<MultiSelect
										options={timezones}
										className='select-container'
										classNamePrefix='select'
										defaultValue={timezones.find((option) => option.value === field.value)}
										value={timezones.find((option) => option.value === field.value)}
										// @ts-ignore
										onChange={(selected) => field.onChange(selected?.value)}
										isSearchable
										name='branch'
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<FormField
					control={form.control}
					name='cronJobConfig.suspend'
					render={({ field }) => (
						<FormItem className='flex justify-between gap-4 items-center space-y-0'>
							<FormLabel>
								<p>{t('container.cronjob.suspend')}</p>
								<p className='text-subtle'>{t('container.cronjob.suspend_help')}</p>
							</FormLabel>
							<FormControl>
								<Switch checked={field.value} onCheckedChange={field.onChange} />
							</FormControl>
						</FormItem>
					)}
				/>
			</ContainerFormTitle>

			<SourceConfig />
			<PodConfiguration />
			<StorageConfig />
		</>
	);
}
