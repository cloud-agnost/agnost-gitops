import {
	FormControl,
	FormDescription,
	FormField,
	FormFieldGroup,
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
import { Switch } from '@/components/Switch';
import { CreateContainerParams } from '@/types/container';
import { Package } from '@phosphor-icons/react';
import { startCase } from 'lodash';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import ContainerFormTitle from './ContainerFormLayout';
import { Fragment, useEffect } from 'react';
import useContainerStore from '@/store/container/containerStore';
export default function AutoScaleConfig() {
	const { t } = useTranslation();
	const form = useFormContext<CreateContainerParams>();
	const { container } = useContainerStore();
	useEffect(() => {
		if (container) return;
		form.setValue('deploymentConfig.desiredReplicas', 1);
		form.setValue('deploymentConfig.minReplicas', 1);
		form.setValue('deploymentConfig.maxReplicas', 5);
		form.setValue('deploymentConfig.cpuMetric.enabled', true);
		form.setValue('deploymentConfig.cpuMetric.metricValue', 80);
		form.setValue('deploymentConfig.cpuMetric.metricType', 'AverageUtilization');
		form.setValue('deploymentConfig.memoryMetric.enabled', true);
		form.setValue('deploymentConfig.memoryMetric.metricValue', 100);
		form.setValue('deploymentConfig.memoryMetric.metricType', 'AverageValueMebibyte');
	}, []);
	return (
		<ContainerFormTitle
			title={t('container.autoscale.title')}
			descriptionI18nKey='container.autoscale.description'
			icon={<Package size={20} />}
		>
			<Fragment>
				<div className='grid grid-cols-2 gap-8'>
					<div className='space-y-6'>
						<FormField
							control={form.control}
							name='deploymentConfig.cpuMetric.enabled'
							render={({ field }) => (
								<FormItem className='flex justify-between gap-4 items-center space-y-0'>
									<FormLabel>{t('container.autoscale.cpu_metric')}</FormLabel>
									<FormControl>
										<Switch checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
								</FormItem>
							)}
						/>
						<FormFieldGroup>
							<FormField
								control={form.control}
								name='deploymentConfig.cpuMetric.metricValue'
								disabled={!form.watch('deploymentConfig.cpuMetric.enabled')}
								render={({ field }) => (
									<FormItem className='flex-1'>
										<FormControl>
											<Input
												disabled={!form.watch('deploymentConfig.cpuMetric.enabled')}
												className='rounded-r-none'
												error={Boolean(
													form.formState.errors.deploymentConfig?.cpuMetric?.metricValue,
												)}
												type='number'
												placeholder={
													t('forms.placeholder', {
														label: t('container.autoscale.cpu_metric'),
													}) ?? ''
												}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name='deploymentConfig.cpuMetric.metricType'
								disabled={!form.watch('deploymentConfig.cpuMetric.enabled')}
								render={({ field }) => (
									<FormItem className='flex-1'>
										<FormControl>
											<Select
												defaultValue={field.value}
												value={field.value}
												onValueChange={field.onChange}
												disabled={!form.watch('deploymentConfig.cpuMetric.enabled')}
											>
												<FormControl>
													<SelectTrigger
														className='w-full rounded-l-none space-x-2'
														error={Boolean(
															form.formState.errors.deploymentConfig?.cpuMetric?.metricType,
														)}
													>
														<SelectValue />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{[
														'AverageUtilization',
														'AverageValueMillicores',
														'AverageValueCores',
													]?.map((type) => (
														<SelectItem key={type} value={type} className='max-w-full'>
															{startCase(type)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</FormFieldGroup>
					</div>
					<div className='space-y-6'>
						<FormField
							control={form.control}
							name='deploymentConfig.memoryMetric.enabled'
							render={({ field }) => (
								<FormItem className='flex justify-between gap-4 items-center space-y-0'>
									<FormLabel>{t('container.autoscale.memory_metric')}</FormLabel>
									<FormControl>
										<Switch checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
								</FormItem>
							)}
						/>
						<FormFieldGroup>
							<FormField
								control={form.control}
								name='deploymentConfig.memoryMetric.metricValue'
								disabled={!form.watch('deploymentConfig.memoryMetric.enabled')}
								render={({ field }) => (
									<FormItem className='flex-1'>
										<FormControl>
											<Input
												disabled={!form.watch('deploymentConfig.memoryMetric.enabled')}
												className='rounded-r-none'
												error={Boolean(
													form.formState.errors.deploymentConfig?.memoryMetric?.metricValue,
												)}
												type='number'
												placeholder={
													t('forms.placeholder', {
														label: t('container.autoscale.cpu_metric'),
													}) ?? ''
												}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name='deploymentConfig.memoryMetric.metricType'
								disabled={!form.watch('deploymentConfig.memoryMetric.enabled')}
								render={({ field }) => (
									<FormItem className='flex-1'>
										<FormControl>
											<Select
												defaultValue={field.value}
												value={field.value}
												onValueChange={field.onChange}
												disabled={!form.watch('deploymentConfig.memoryMetric.enabled')}
											>
												<FormControl>
													<SelectTrigger
														className='w-full rounded-l-none space-x-2'
														error={Boolean(
															form.formState.errors.deploymentConfig?.memoryMetric?.metricType,
														)}
													>
														<SelectValue />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{['AverageValueMebibyte', 'AverageValueGibibyte']?.map((type) => (
														<SelectItem key={type} value={type} className='max-w-full'>
															{startCase(type)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</FormFieldGroup>
					</div>
				</div>
				{(form.watch('deploymentConfig.cpuMetric.enabled') ||
					form.watch('deploymentConfig.memoryMetric.enabled')) && (
					<div className='flex items-center gap-4'>
						<FormField
							control={form.control}
							name='deploymentConfig.minReplicas'
							render={({ field }) => (
								<FormItem className='flex-1'>
									<FormLabel>{t('container.autoscale.min_replicas')}</FormLabel>
									<FormControl>
										<Input
											error={Boolean(form.formState.errors.deploymentConfig?.minReplicas)}
											placeholder={
												t('forms.placeholder', {
													label: t('container.autoscale.min_replicas'),
												}) ?? ''
											}
											{...field}
										/>
									</FormControl>
									<FormDescription>{t('container.autoscale.min_replicas_help')}</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='deploymentConfig.maxReplicas'
							render={({ field }) => (
								<FormItem className='flex-1'>
									<FormLabel>{t('container.autoscale.max_replicas')}</FormLabel>
									<FormControl>
										<Input
											error={Boolean(form.formState.errors.deploymentConfig?.maxReplicas)}
											placeholder={
												t('forms.placeholder', {
													label: t('container.autoscale.max_replicas'),
												}) ?? ''
											}
											{...field}
										/>
									</FormControl>
									<FormDescription>{t('container.autoscale.max_replicas_help')}</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				)}
			</Fragment>
		</ContainerFormTitle>
	);
}
