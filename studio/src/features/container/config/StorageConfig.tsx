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
import { Switch } from '@/components/Switch';
import useContainerStore from '@/store/container/containerStore';
import { ContainerType, CreateContainerParams, StateOption } from '@/types';
import { Database } from '@phosphor-icons/react';
import _, { startCase } from 'lodash';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import MultiSelect, { OptionProps, components } from 'react-select';
import ContainerFormTitle from './ContainerFormLayout';

const accessModesOptions: StateOption[] = [
	{ value: 'ReadWriteOnce', label: 'ReadWriteOnce' },
	{ value: 'ReadOnlyMany', label: 'ReadOnlyMany' },
	{ value: 'ReadWriteMany', label: 'ReadWriteMany' },
];

export default function StorageConfig() {
	const { t } = useTranslation();
	const form = useFormContext<CreateContainerParams>();
	const { container, template } = useContainerStore();
	const visibleFields = template?.config?.visibleFields ?? [];
	const disabledFields = template?.config?.disabledFields ?? [];

	return (
		<ContainerFormTitle
			title={t('container.storage.title')}
			icon={<Database size={20} />}
			descriptionI18nKey='container.storage.description'
		>
			{(visibleFields?.includes('storageConfig.enabled') || !visibleFields.length) && (
				<FormField
					control={form.control}
					name='storageConfig.enabled'
					render={({ field }) => (
						<FormItem className='flex justify-between gap-4 items-center space-y-0 self-start mt-2'>
							<FormLabel>{t('container.storage.enable')}</FormLabel>
							<FormControl>
								<Switch
									disabled={
										(!_.isNil(container) && container?.type === ContainerType.StatefulSet) ||
										disabledFields?.includes('storageConfig.enabled')
									}
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
							</FormControl>
						</FormItem>
					)}
				/>
			)}
			{form.watch('storageConfig.enabled') && (
				<div className='space-y-4'>
					<div className='grid grid-cols-2 gap-4'>
						{(visibleFields?.includes('storageConfig.mountPath') || !visibleFields.length) && (
							<FormField
								control={form.control}
								name='storageConfig.mountPath'
								render={({ field }) => (
									<FormItem className='flex-1'>
										<FormLabel>{t('container.storage.mount_path')}</FormLabel>
										<FormControl>
											<Input
												error={Boolean(form.formState.errors.storageConfig?.mountPath)}
												placeholder={
													t('forms.placeholder', {
														label: t('container.storage.mount_path'),
													}) ?? ''
												}
												disabled={disabledFields?.includes('storageConfig.mountPath')}
												{...field}
												value={String(field.value || '')}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
						<FormFieldGroup label={t('container.storage.storage_size') ?? ''}>
							{(visibleFields?.includes('storageConfig.size') || !visibleFields.length) && (
								<FormField
									control={form.control}
									name='storageConfig.size'
									render={({ field }) => (
										<FormItem className='flex-1'>
											<FormControl>
												<Input
													className='rounded-r-none'
													error={Boolean(form.formState.errors.storageConfig?.size)}
													type='number'
													placeholder={
														t('forms.placeholder', {
															label: t('container.storage.storage_size'),
														}) ?? ''
													}
													disabled={disabledFields?.includes('storageConfig.size')}
													{...field}
													value={String(field.value || '')}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}
							{(visibleFields?.includes('storageConfig.sizeType') || !visibleFields.length) && (
								<FormField
									control={form.control}
									name='storageConfig.sizeType'
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
															error={Boolean(form.formState.errors.storageConfig?.sizeType)}
															disabled={disabledFields?.includes('storageConfig.sizeType')}
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
							)}
						</FormFieldGroup>
					</div>
					{(visibleFields?.includes('storageConfig.accessModes') || !visibleFields.length) && (
						<FormField
							control={form.control}
							name='storageConfig.accessModes'
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('container.storage.accessModes')}</FormLabel>
									<MultiSelect
										isDisabled={
											container?.storageConfig?.enabled ||
											disabledFields?.includes('storageConfig.accessModes')
										}
										isMulti
										components={{ Option }}
										options={accessModesOptions}
										className='select-container'
										classNamePrefix='select'
										// @ts-ignore
										defaultValue={field.value?.map((value) =>
											accessModesOptions.find((option) => option.value === value),
										)}
										onChange={(selected) => field.onChange(selected.map((s) => s.value))}
										styles={{
											multiValueLabel: (base) => ({
												...base,
												color: 'white',
											}),
										}}
									/>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}
					{form.watch('type') === ContainerType.StatefulSet && (
						<div className='grid grid-cols-2 gap-4'>
							{((!visibleFields.length ||
								visibleFields.includes(
									'statefulSetConfig.persistentVolumeClaimRetentionPolicy.whenDeleted',
								)) ??
								true) && (
								<FormField
									control={form.control}
									name='statefulSetConfig.persistentVolumeClaimRetentionPolicy.whenDeleted'
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('container.stateful.retention_policy_delete')}</FormLabel>
											<Select
												value={field.value}
												defaultValue={field.value}
												onValueChange={field.onChange}
												disabled={disabledFields?.includes(
													'statefulSetConfig.persistentVolumeClaimRetentionPolicy.whenDeleted',
												)}
											>
												<FormControl>
													<SelectTrigger className='w-full'>
														<SelectValue>{field.value}</SelectValue>
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<div className='space-y-2'>
														{['Retain', 'Delete'].map((policy) => (
															<SelectItem key={policy} value={policy}>
																{policy}
																<p className='text-xs text-subtle whitespace-break-spaces'>
																	{t(`container.stateful.${policy}`)}
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
							{((!visibleFields.length ||
								visibleFields.includes(
									'statefulSetConfig.persistentVolumeClaimRetentionPolicy.whenScaled',
								)) ??
								true) && (
								<FormField
									control={form.control}
									name='statefulSetConfig.persistentVolumeClaimRetentionPolicy.whenScaled'
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('container.stateful.retention_policy_scale')}</FormLabel>
											<Select
												value={field.value}
												defaultValue={field.value}
												onValueChange={field.onChange}
												disabled={disabledFields?.includes(
													'statefulSetConfig.persistentVolumeClaimRetentionPolicy.whenScaled',
												)}
											>
												<FormControl>
													<SelectTrigger className='w-full'>
														<SelectValue>{field.value}</SelectValue>
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<div className='space-y-2'>
														{['Retain', 'Delete'].map((policy) => (
															<SelectItem key={policy} value={policy}>
																{policy}
																<p className='text-xs text-subtle whitespace-break-spaces'>
																	{t(`container.stateful.${policy}`)}
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
						</div>
					)}
				</div>
			)}
		</ContainerFormTitle>
	);
}

const Option = (props: OptionProps<StateOption>) => {
	const { t } = useTranslation();
	return (
		<div>
			<components.Option {...props}>
				{props.label}
				<p className='text-xs text-subtle text-pretty max-w-[90ch]'>
					{t(`container.storage.${props.label}`)}
				</p>
			</components.Option>
		</div>
	);
};
