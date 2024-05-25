import {
	FormControl,
	FormField,
	FormFieldGroup,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/Form';
import { Input } from '@/components/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import { ContainerType, CreateContainerParams } from '@/types/container';
import { Cube } from '@phosphor-icons/react';
import { startCase } from 'lodash';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import ContainerFormTitle from './ContainerFormLayout';
import { useEffect, useMemo } from 'react';
import useContainerStore from '@/store/container/containerStore';
export default function PodConfiguration() {
	const { t } = useTranslation();
	const form = useFormContext<CreateContainerParams>();
	const { container } = useContainerStore();
	const RESTART_POLICIES = useMemo(() => {
		if (form.watch('type') === ContainerType.CronJob) {
			return ['OnFailure', 'Never'] as const;
		}
		return ['Always', 'OnFailure', 'Never'] as const;
	}, [form.watch('type')]);

	useEffect(() => {
		if (form.watch('type') === ContainerType.CronJob) {
			form.setValue('podConfig.restartPolicy', container?.podConfig?.restartPolicy ?? 'OnFailure');
		}
	}, []);
	return (
		<ContainerFormTitle
			title={t('container.pod_config.title')}
			descriptionI18nKey='container.pod_config.description'
			icon={<Cube size={20} />}
		>
			<div className='grid grid-cols-2 gap-6'>
				<FormFieldGroup label={t('container.pod_config.cpu_request') ?? ''}>
					<FormField
						control={form.control}
						name='podConfig.cpuRequest'
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Input
										className='rounded-r-none'
										error={Boolean(form.formState.errors.podConfig?.cpuRequest)}
										placeholder={
											t('forms.placeholder', {
												label: t('container.pod_config.cpu_request'),
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
						name='podConfig.cpuRequestType'
						render={({ field }) => (
							<FormItem className='flex-1'>
								<FormControl>
									<Select
										defaultValue={field.value}
										value={field.value}
										onValueChange={field.onChange}
									>
										<FormControl>
											<SelectTrigger
												className='w-full rounded-l-none space-x-2'
												error={Boolean(form.formState.errors.podConfig?.cpuRequestType)}
											>
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{['millicores', 'cores']?.map((type) => (
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
				<FormFieldGroup label={t('container.pod_config.cpu_limit') ?? ''}>
					<FormField
						control={form.control}
						name='podConfig.cpuLimit'
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Input
										className='rounded-r-none'
										error={Boolean(form.formState.errors.podConfig?.cpuLimit)}
										placeholder={
											t('forms.placeholder', {
												label: t('container.pod_config.cpu_limit'),
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
						name='podConfig.cpuLimitType'
						render={({ field }) => (
							<FormItem className='flex-1'>
								<FormControl>
									<Select
										defaultValue={field.value}
										value={field.value}
										onValueChange={field.onChange}
									>
										<FormControl>
											<SelectTrigger
												className='w-full rounded-l-none space-x-2'
												error={Boolean(form.formState.errors.podConfig?.cpuLimitType)}
											>
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{['millicores', 'cores']?.map((type) => (
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
				<FormFieldGroup label={t('container.pod_config.memory_request') ?? ''}>
					<FormField
						control={form.control}
						name='podConfig.memoryRequest'
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Input
										className='rounded-r-none'
										error={Boolean(form.formState.errors.podConfig?.memoryRequest)}
										placeholder={
											t('forms.placeholder', {
												label: t('container.pod_config.memory_request'),
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
						name='podConfig.memoryRequestType'
						render={({ field }) => (
							<FormItem className='flex-1'>
								<FormControl>
									<Select
										defaultValue={field.value}
										value={field.value}
										onValueChange={field.onChange}
									>
										<FormControl>
											<SelectTrigger
												className='w-full rounded-l-none space-x-2'
												error={Boolean(form.formState.errors.podConfig?.memoryRequestType)}
											>
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{['mebibyte', 'gibibyte']?.map((type) => (
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
				<FormFieldGroup label={t('container.pod_config.memory_limit') ?? ''}>
					<FormField
						control={form.control}
						name='podConfig.memoryLimit'
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Input
										className='rounded-r-none'
										error={Boolean(form.formState.errors.podConfig?.memoryLimit)}
										placeholder={
											t('forms.placeholder', {
												label: t('container.pod_config.memory_limit'),
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
						name='podConfig.memoryLimitType'
						render={({ field }) => (
							<FormItem className='flex-1'>
								<FormControl>
									<Select
										defaultValue={field.value}
										value={field.value}
										onValueChange={field.onChange}
									>
										<FormControl>
											<SelectTrigger
												className='w-full rounded-l-none space-x-2'
												error={Boolean(form.formState.errors.podConfig?.memoryLimitType)}
											>
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{['mebibyte', 'gibibyte']?.map((type) => (
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
			<FormField
				control={form.control}
				name='podConfig.restartPolicy'
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('container.pod_config.restart_policy')}</FormLabel>
						<Select value={field.value} defaultValue={field.value} onValueChange={field.onChange}>
							<FormControl>
								<SelectTrigger className='w-full'>
									<SelectValue>{field.value}</SelectValue>
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<div className='space-y-2'>
									{RESTART_POLICIES.map((policy) => (
										<SelectItem key={policy} value={policy}>
											{policy}
											<p className='text-xs text-subtle whitespace-break-spaces'>
												{t(`container.pod_config.${policy}`)}
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
		</ContainerFormTitle>
	);
}
