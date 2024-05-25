import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/Form';
import { Input } from '@/components/Input';
import { CreateContainerParams } from '@/types/container';
import { IdentificationCard } from '@phosphor-icons/react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Networking, PodConfiguration, Probes, SourceConfig, StorageConfig } from '../config';
import ContainerFormTitle from '../config/ContainerFormLayout';
import { useEffect } from 'react';
import useContainerStore from '@/store/container/containerStore';
export default function StatefulForm() {
	const { t } = useTranslation();
	const form = useFormContext<CreateContainerParams>();
	const { container } = useContainerStore();
	useEffect(() => {
		form.setValue(
			'statefulSetConfig.desiredReplicas',
			container?.statefulSetConfig?.desiredReplicas ?? 1,
		);
		form.setValue(
			'statefulSetConfig.persistentVolumeClaimRetentionPolicy.whenDeleted',
			container?.statefulSetConfig?.persistentVolumeClaimRetentionPolicy?.whenDeleted ?? 'Retain',
		);
		form.setValue(
			'statefulSetConfig.persistentVolumeClaimRetentionPolicy.whenScaled',
			container?.statefulSetConfig?.persistentVolumeClaimRetentionPolicy?.whenScaled ?? 'Retain',
		);
	}, [container]);

	return (
		<>
			<ContainerFormTitle
				title={t('container.general')}
				descriptionI18nKey='container.stateful.description'
				icon={<IdentificationCard size={20} />}
			>
				<div className='flex justify-center gap-4'>
					<FormField
						control={form.control}
						name='name'
						render={({ field }) => (
							<FormItem className='flex-1'>
								<FormLabel>{t('container.stateful.name')}</FormLabel>
								<FormControl>
									<Input
										error={Boolean(form.formState.errors.name)}
										placeholder={
											t('forms.placeholder', {
												label: t('container.stateful.name'),
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
						name='statefulSetConfig.desiredReplicas'
						render={({ field }) => (
							<FormItem className='flex-1'>
								<FormLabel>{t('container.deployment.replicas')}</FormLabel>
								<FormControl>
									<Input
										error={Boolean(form.formState.errors.name)}
										type='number'
										placeholder={
											t('forms.placeholder', {
												label: t('container.deployment.replicas'),
											}) ?? ''
										}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			</ContainerFormTitle>

			<SourceConfig />
			<Networking />
			<PodConfiguration />
			<Probes />
			<StorageConfig />
		</>
	);
}
