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
import { ContainerType, CreateContainerParams } from '@/types';
import { Cube } from '@phosphor-icons/react';
import { startCase } from 'lodash';
import { useFormContext, FieldValues, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import ContainerFormTitle from './ContainerFormLayout';
import { useEffect, useMemo } from 'react';
import useContainerStore from '@/store/container/containerStore';

const useRestartPolicies = (type: ContainerType) => {
	const { setValue } = useFormContext<CreateContainerParams>();
	const { container } = useContainerStore();
	const RESTART_POLICIES = useMemo(() => {
		return type === ContainerType.CronJob
			? ['OnFailure', 'Never']
			: ['Always', 'OnFailure', 'Never'];
	}, [type]);

	useEffect(() => {
		if (type === ContainerType.CronJob) {
			setValue('podConfig.restartPolicy', container?.podConfig?.restartPolicy ?? 'OnFailure');
		}
	}, [type, setValue, container]);

	return RESTART_POLICIES;
};

interface RenderFormFieldGroupProps<T extends FieldValues> {
	fieldName: Path<T>;
	fieldType: Path<T>;
	labelKey: string;
	placeholderKey: string;
	options: string[];
}

export default function PodConfiguration() {
	const { t } = useTranslation();
	const form = useFormContext<CreateContainerParams>();
	const { template } = useContainerStore();
	const visibleFields = template?.config?.visibleFields ?? [];
	const disabledFields = template?.config?.disabledFields ?? [];
	const type = form.watch('type');
	const RESTART_POLICIES = useRestartPolicies(type as ContainerType);
	const { errors } = form.formState;
	const renderFormFieldGroup = ({
		fieldName,
		fieldType,
		labelKey,
		placeholderKey,
		options,
	}: RenderFormFieldGroupProps<CreateContainerParams>) => (
		<FormFieldGroup label={t(labelKey) ?? ''}>
			<FormField
				control={form.control}
				name={fieldName}
				render={({ field }) => (
					<FormItem>
						<FormControl>
							<Input
								className='rounded-r-none'
								error={Boolean(errors[fieldName as keyof typeof errors])}
								placeholder={t('forms.placeholder', { label: t(placeholderKey) }) ?? ''}
								disabled={disabledFields?.includes(fieldName)}
								{...field}
								value={field.value?.toString()}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name={fieldType}
				render={({ field }) => (
					<FormItem className='flex-1'>
						<FormControl>
							<Select value={field.value?.toString()} onValueChange={field.onChange}>
								<FormControl>
									<SelectTrigger
										className='w-full rounded-l-none space-x-2'
										error={Boolean(errors[fieldType as keyof typeof errors])}
										disabled={disabledFields?.includes(fieldType)}
									>
										<SelectValue />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{options?.map((option) => (
										<SelectItem key={option} value={option} className='max-w-full'>
											{startCase(option)}
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
	);

	return (
		<ContainerFormTitle
			title={t('container.pod_config.title')}
			descriptionI18nKey='container.pod_config.description'
			icon={<Cube size={20} />}
		>
			<div className='grid grid-cols-2 gap-6'>
				{(!visibleFields.length || visibleFields.includes('podConfig.cpuRequest')) &&
					renderFormFieldGroup({
						fieldName: 'podConfig.cpuRequest',
						fieldType: 'podConfig.cpuRequestType',
						labelKey: 'container.pod_config.cpu_request',
						placeholderKey: 'container.pod_config.cpu_request',
						options: ['millicores', 'cores'],
					})}
				{(!visibleFields.length || visibleFields.includes('podConfig.cpuLimit')) &&
					renderFormFieldGroup({
						fieldName: 'podConfig.cpuLimit',
						fieldType: 'podConfig.cpuLimitType',
						labelKey: 'container.pod_config.cpu_limit',
						placeholderKey: 'container.pod_config.cpu_limit',
						options: ['millicores', 'cores'],
					})}
				{(!visibleFields.length || visibleFields.includes('podConfig.memoryRequest')) &&
					renderFormFieldGroup({
						fieldName: 'podConfig.memoryRequest',
						fieldType: 'podConfig.memoryRequestType',
						labelKey: 'container.pod_config.memory_request',
						placeholderKey: 'container.pod_config.memory_request',
						options: ['mebibyte', 'gibibyte'],
					})}
				{(!visibleFields.length || visibleFields.includes('podConfig.memoryLimit')) &&
					renderFormFieldGroup({
						fieldName: 'podConfig.memoryLimit',
						fieldType: 'podConfig.memoryLimitType',
						labelKey: 'container.pod_config.memory_limit',
						placeholderKey: 'container.pod_config.memory_limit',
						options: ['mebibyte', 'gibibyte'],
					})}
			</div>
			{(!visibleFields.length || visibleFields.includes('podConfig.restartPolicy')) && (
				<FormField
					control={form.control}
					name='podConfig.restartPolicy'
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('container.pod_config.restart_policy')}</FormLabel>
							<Select
								value={field.value}
								defaultValue={field.value}
								onValueChange={field.onChange}
								disabled={disabledFields?.includes('podConfig.restartPolicy')}
							>
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
			)}
		</ContainerFormTitle>
	);
}
