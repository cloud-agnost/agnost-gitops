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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import { MEMORY_REGEX } from '@/constants';
import { useToast } from '@/hooks';
import useClusterStore from '@/store/cluster/clusterStore';
import useTypeStore from '@/store/types/typeStore';
import { APIError } from '@/types';
import { translate } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';

const Schema = z.object({
	updateType: z.enum(['size', 'others']),
	config: z.object({
		replicas: z.coerce.number().min(1).optional(),
		size: z
			.string({
				required_error: translate('forms.required', {
					label: translate('resources.database.storage_size'),
				}),
			})
			.regex(MEMORY_REGEX, {
				message: translate('forms.invalidSize'),
			}),
		version: z.string({
			required_error: translate('forms.required', {
				label: translate('resources.version'),
			}),
		}),
		readReplica: z.boolean().optional(),
	}),
});

export default function EditClusterConfig() {
	const { t } = useTranslation();
	const { resourceVersions } = useTypeStore();
	const { toast } = useToast();
	const { clusterComponent, updateRemainingClusterComponents, closeEditClusterComponent } =
		useClusterStore();
	const form = useForm<z.infer<typeof Schema>>({
		resolver: zodResolver(Schema),
		defaultValues: {
			config: {
				size: clusterComponent?.info?.pvcSize,
				version: clusterComponent?.info?.version,
				replicas: clusterComponent?.info?.configuredReplicas,
				// readReplica: clusterComponent.info,
			},
		},
	});
	const { isPending, mutate } = useMutation({
		mutationKey: ['updateClusterComponent'],
		mutationFn: updateRemainingClusterComponents,
		onSuccess: () => {
			closeEditClusterComponent();
		},
		onError: (error: APIError) => {
			toast({
				title: error.details,
				action: 'error',
			});
		},
	});
	function onSubmit(data: z.infer<typeof Schema>) {
		mutate({
			...data,
			componentName: clusterComponent.name,
		});
	}

	function updateSize() {
		form.setValue('updateType', 'size');
		form.handleSubmit(onSubmit)();
	}

	function updateOthers() {
		form.setValue('updateType', 'others');
		form.handleSubmit(onSubmit)();
	}

	const versions = useMemo(() => {
		if (clusterComponent.type === 'MinIO') return [];
		return [
			...new Set([...resourceVersions[clusterComponent.type], clusterComponent.info.version]),
		];
	}, [clusterComponent.type, clusterComponent.info.version, resourceVersions]);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className='p-6 space-y-6'>
				<div className='flex items-center justify-center'>
					<FormField
						control={form.control}
						name='config.size'
						render={({ field }) => (
							<FormItem className='flex-1'>
								<FormLabel>{t('resources.database.storage_size')}</FormLabel>
								<FormControl>
									<Input
										placeholder={t('resources.database.storage_size_placeholder') ?? ''}
										error={!!form.formState.errors.config?.size}
										{...field}
									/>
								</FormControl>
								<FormDescription>
									{t('resources.database.storage_size_description')}
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button className='ml-2' size='lg' type='button' onClick={updateSize} loading={isPending}>
						{t('resources.update_size')}
					</Button>
				</div>
				{clusterComponent.type !== 'MinIO' && (
					<>
						{clusterComponent.type !== 'Redis' && (
							<FormField
								control={form.control}
								name={`config.replicas`}
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t(`resources.database.replicas`)}</FormLabel>
										<FormControl className='flex'>
											<Input
												type='number'
												placeholder={t('resources.database.instance_placeholder') ?? ''}
												error={!!form.formState.errors.config?.replicas}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
						<FormField
							control={form.control}
							name='config.version'
							render={({ field }) => (
								<FormItem className='flex-1'>
									<FormLabel>{t('resources.version')}</FormLabel>
									<FormControl>
										<FormControl>
											<Select
												defaultValue={field.value}
												value={field.value}
												name={field.name}
												onValueChange={field.onChange}
											>
												<FormControl>
													<SelectTrigger
														className='w-full'
														error={Boolean(form.formState.errors.config?.version)}
													>
														<SelectValue placeholder={t('resources.select_version')} />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{versions?.map((version) => (
														<SelectItem key={version} value={version} className='max-w-full'>
															{version}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className='flex items-center justify-end'>
							<Button
								className='ml-2'
								size='xl'
								type='button'
								onClick={updateOthers}
								loading={isPending}
							>
								{t('resources.update_replica_and_version')}
							</Button>
						</div>
					</>
				)}
			</form>
		</Form>
	);
}
