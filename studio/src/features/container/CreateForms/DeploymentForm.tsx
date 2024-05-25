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
import {
	AutoScaleConfig,
	Networking,
	PodConfiguration,
	Probes,
	SourceConfig,
	StorageConfig,
} from '../config';
import ContainerFormTitle from '../config/ContainerFormLayout';

export default function DeploymentForm() {
	const { t } = useTranslation();
	const form = useFormContext<CreateContainerParams>();

	return (
		<>
			<ContainerFormTitle
				title={t('container.general')}
				descriptionI18nKey='container.deployment.description'
				icon={<IdentificationCard size={20} />}
			>
				<div className='flex justify-center gap-4'>
					<FormField
						control={form.control}
						name='name'
						render={({ field }) => (
							<FormItem className='flex-1'>
								<FormLabel>{t('container.deployment.name')}</FormLabel>
								<FormControl>
									<Input
										error={Boolean(form.formState.errors.name)}
										placeholder={
											t('forms.placeholder', {
												label: t('container.deployment.name'),
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
						name='deploymentConfig.desiredReplicas'
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
			<AutoScaleConfig />
			<Probes />
			<StorageConfig />
		</>
	);
}
