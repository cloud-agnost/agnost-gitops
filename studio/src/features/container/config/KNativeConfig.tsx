import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/Form';
import { Input } from '@/components/Input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/Select/Select';
import { CreateContainerParams } from '@/types/container';
import { Package } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import ContainerFormTitle from './ContainerFormLayout';
import { Separator } from '@/components/Separator';
import useContainerStore from '@/store/container/containerStore';

export default function KNativeConfig() {
	const { t } = useTranslation();
	const form = useFormContext<CreateContainerParams>();
	const { container } = useContainerStore();
	useEffect(() => {
		if (container) return;
		form.setValue('knativeConfig.concurrency', 100);
		form.setValue('knativeConfig.scalingMetric', 'concurrency');
		form.setValue('knativeConfig.scalingMetricTarget', 70);
		form.setValue('knativeConfig.minScale', 0);
		form.setValue('knativeConfig.maxScale', 1);
		form.setValue('knativeConfig.scaleDownDelay', 300);
		form.setValue('knativeConfig.scaleToZeroPodRetentionPeriod', 600);
	}, []);

	return (
		<ContainerFormTitle
			title={t('container.autoscale.title')}
			descriptionI18nKey='container.autoscale.description'
			icon={<Package size={20} />}
		>
			<FormField
				control={form.control}
				name='knativeConfig.concurrency'
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('container.knative.concurrency_config')}</FormLabel>
						<FormControl>
							<Input
								error={Boolean(form.formState.errors.knativeConfig?.concurrency)}
								type='number'
								placeholder={
									t('forms.placeholder', {
										label: t('container.knative.concurrency_config'),
									}) ?? ''
								}
								{...field}
							/>
						</FormControl>
						<FormDescription>{t('container.knative.concurrency_help')}</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<div className='grid grid-cols-2 gap-8'>
				<FormField
					control={form.control}
					name='knativeConfig.scalingMetric'
					render={({ field }) => (
						<FormItem className='flex-1'>
							<FormLabel>{t('container.knative.scaling_metric')}</FormLabel>
							<FormControl>
								<Select
									defaultValue={field.value}
									value={field.value}
									onValueChange={field.onChange}
								>
									<FormControl>
										<SelectTrigger
											className='w-full rounded-l-none space-x-2'
											error={Boolean(form.formState.errors.knativeConfig?.scalingMetric)}
										>
											<SelectValue />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{['concurrency', 'rps', 'cpu', 'memory']?.map((metric) => (
											<SelectItem key={metric} value={metric} className='max-w-full'>
												{t(`container.knative.${metric}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='knativeConfig.scalingMetricTarget'
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('container.knative.metric_target')}</FormLabel>
							<FormControl>
								<div className='flex items-center bg-input-background rounded-sm pr-2 h-9 gap-2'>
									<Input
										className='flex-1 !bg-transparent'
										error={Boolean(form.formState.errors.knativeConfig?.scalingMetricTarget)}
										type='number'
										placeholder={
											t('forms.placeholder', {
												label: t('container.knative.metric_target'),
											}) ?? ''
										}
										{...field}
									/>
									<Separator
										orientation='vertical'
										className='bg-subtle dark:bg-base-reverse/50 h-3/4'
									/>
									<p className='text-sm text-subtle'>
										{t(`container.knative.${form.watch('knativeConfig.scalingMetric')}_postfix`)}
									</p>
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='knativeConfig.minScale'
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('container.knative.min_replicas')}</FormLabel>
							<FormControl>
								<Input
									error={Boolean(form.formState.errors.knativeConfig?.minScale)}
									type='number'
									placeholder={
										t('forms.placeholder', {
											label: t('container.knative.min_replicas'),
										}) ?? ''
									}
									{...field}
								/>
							</FormControl>
							<FormDescription>{t('container.knative.min_replicas_help')}</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='knativeConfig.maxScale'
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('container.knative.max_replicas')}</FormLabel>
							<FormControl>
								<Input
									error={Boolean(form.formState.errors.knativeConfig?.maxScale)}
									type='number'
									placeholder={
										t('forms.placeholder', {
											label: t('container.knative.max_replicas'),
										}) ?? ''
									}
									{...field}
								/>
							</FormControl>
							<FormDescription>{t('container.knative.max_replicas_help')}</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='knativeConfig.scaleDownDelay'
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('container.knative.scale_down_delay')}</FormLabel>
							<FormControl>
								<div className='flex items-center bg-input-background rounded-sm pr-2 h-9 gap-2'>
									<Input
										className='flex-1 !bg-transparent'
										error={Boolean(form.formState.errors.knativeConfig?.scaleDownDelay)}
										type='number'
										placeholder={
											t('forms.placeholder', {
												label: t('container.knative.scale_down_delay'),
											}) ?? ''
										}
										{...field}
									/>
									<Separator
										orientation='vertical'
										className='bg-subtle dark:bg-base-reverse/50 h-3/4'
									/>
									<p className='text-sm text-subtle'>{t('container.knative.seconds')}</p>
								</div>
							</FormControl>

							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='knativeConfig.scaleToZeroPodRetentionPeriod'
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('container.knative.scale_to_zero')}</FormLabel>
							<FormControl>
								<div className='flex items-center bg-input-background rounded-sm pr-2 h-9 gap-2'>
									<Input
										className='flex-1 !bg-transparent'
										error={Boolean(
											form.formState.errors.knativeConfig?.scaleToZeroPodRetentionPeriod,
										)}
										type='number'
										placeholder={
											t('forms.placeholder', {
												label: t('container.knative.scale_to_zero'),
											}) ?? ''
										}
										{...field}
									/>
									<Separator
										orientation='vertical'
										className='bg-subtle dark:bg-base-reverse/50 h-3/4'
									/>
									<p className='text-sm text-subtle'>{t('container.knative.seconds')}</p>
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</ContainerFormTitle>
	);
}
