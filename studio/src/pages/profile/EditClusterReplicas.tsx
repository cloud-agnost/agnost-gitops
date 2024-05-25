import { Button } from '@/components/Button';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/Form';
import { Input } from '@/components/Input';
import { useToast } from '@/hooks';
import useClusterStore from '@/store/cluster/clusterStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';

const Schema = z.object({
	replicas: z.coerce.number().int().positive(),
	minReplicas: z.coerce.number().int().positive(),
	maxReplicas: z.coerce.number().int().positive(),
});

export default function EditClusterReplicas() {
	const { toast } = useToast();
	const [loading, setLoading] = useState(false);
	const { t } = useTranslation();
	const {
		isEditClusterComponentOpen,
		clusterComponent,
		updateClusterComponent,
		closeEditClusterComponent,
	} = useClusterStore();

	const form = useForm<z.infer<typeof Schema>>({
		resolver: zodResolver(Schema),
		defaultValues: {
			replicas: clusterComponent?.info?.configuredReplicas,
			minReplicas: clusterComponent?.info?.minReplicas,
			maxReplicas: clusterComponent?.info?.maxReplicas,
		},
	});

	function onSubmit(data: z.infer<typeof Schema>) {
		setLoading(true);
		updateClusterComponent({
			deploymentName: clusterComponent?.deploymentName,
			hpaName: clusterComponent?.hpaName,
			...data,
			onSuccess: () => {
				setLoading(false);
				form.reset();
				closeEditClusterComponent();
			},
			onError: (error) => {
				setLoading(false);
				toast({ action: 'error', title: error.details });
			},
		});
	}

	useEffect(() => {
		if (isEditClusterComponentOpen && clusterComponent) {
			form.reset({
				replicas: clusterComponent?.info?.configuredReplicas,
				minReplicas: clusterComponent?.info?.minReplicas,
				maxReplicas: clusterComponent?.info?.maxReplicas,
			});
		}
	}, [isEditClusterComponentOpen]);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className='p-6  space-y-8 flex flex-col'>
				<FormField
					control={form.control}
					name='replicas'
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('cluster.replicas')}</FormLabel>

							<FormControl>
								<Input
									error={!!form.formState.errors.replicas}
									placeholder={t('forms.placeholder', {
										label: t('cluster.replicas'),
									}).toString()}
									{...field}
								/>
							</FormControl>
							<FormDescription>{t('cluster.replicasDescription')}</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className='flex space-x-4'>
					<FormField
						control={form.control}
						name='minReplicas'
						render={({ field }) => (
							<FormItem className='flex-1'>
								<FormLabel>{t('cluster.minReplicas')}</FormLabel>
								<FormControl>
									<Input
										error={!!form.formState.errors.minReplicas}
										placeholder={t('forms.placeholder', {
											label: t('cluster.minReplicas'),
										}).toString()}
										{...field}
									/>
								</FormControl>
								<FormDescription>{t('cluster.minReplicasDescription')}</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name='maxReplicas'
						render={({ field }) => (
							<FormItem className='flex-1'>
								<FormLabel>{t('cluster.maxReplicas')}</FormLabel>
								<FormControl>
									<Input
										error={!!form.formState.errors.maxReplicas}
										placeholder={t('forms.placeholder', {
											label: t('cluster.maxReplicas'),
										}).toString()}
										{...field}
									/>
								</FormControl>
								<FormDescription>{t('cluster.maxReplicasDescription')}</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<Button type='submit' loading={loading} size='lg' className='self-end'>
					{t('general.save')}
				</Button>
			</form>
		</Form>
	);
}
