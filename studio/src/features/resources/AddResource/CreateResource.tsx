import { Checkbox } from '@/components/Checkbox';
import { Form, FormDescription } from '@/components/Form';
import { Input } from '@/components/Input';
import { CreateResourceLayout } from '@/features/resources';
import { useToast } from '@/hooks';
import useResourceStore from '@/store/resources/resourceStore';
import useTypeStore from '@/store/types/typeStore';
import { CreateResourceSchema, ResourceInstances } from '@/types';
import { isEmpty } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from 'components/Form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/Select';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import * as z from 'zod';
export default function CreateResource() {
	const form = useForm<z.infer<typeof CreateResourceSchema>>({
		resolver: zodResolver(CreateResourceSchema),
	});
	const { t } = useTranslation();
	const replicationType =
		form.watch('instance') === ResourceInstances.MongoDB ||
		form.watch('instance') === ResourceInstances.RabbitMQ
			? 'replicas'
			: 'instances';
	const { createNewResource, toggleCreateResourceModal, closeEditResourceModal, resourceToEdit } =
		useResourceStore();
	const { resourceVersions } = useTypeStore();
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();
	const { orgId } = useParams() as Record<string, string>;
	const onSubmit = (data: z.infer<typeof CreateResourceSchema>) => {
		setLoading(true);
		createNewResource({
			...data,
			orgId,
			onSuccess: () => {
				form.reset();
				if (isEmpty(resourceToEdit)) toggleCreateResourceModal();
				else closeEditResourceModal();
				setLoading(false);
			},
			onError: (error) => {
				setLoading(false);
				toast({
					title: error?.details,
					action: 'error',
				});
			},
		});
	};
	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<CreateResourceLayout loading={loading}>
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
					<FormField
						control={form.control}
						name='config.version'
						render={({ field }) => (
							<FormItem className='flex-1'>
								<FormLabel>{t('resources.version')}</FormLabel>
								<FormControl>
									<FormControl>
										<Select defaultValue={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger
													className='w-full'
													error={Boolean(form.formState.errors.config?.version)}
												>
													<SelectValue placeholder={t('resources.select_version')} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{resourceVersions[form.watch('instance')]?.map((version) => (
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
					{form.watch('type') !== 'cache' ? (
						<FormField
							control={form.control}
							name={`config.${replicationType}`}
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t(`resources.database.${replicationType}`)}</FormLabel>
									<FormControl>
										<Input
											type='number'
											placeholder={t('resources.database.instance_placeholder') ?? ''}
											error={!!form.formState.errors.config?.instances}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					) : (
						<FormField
							control={form.control}
							name='config.readReplica'
							render={({ field }) => (
								<FormItem className='flex space-y-0 space-x-4'>
									<FormControl>
										<Checkbox checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
									<div className='space-y-1 leading-none'>
										<FormLabel>{t('resources.cache.createdReadReplica')}</FormLabel>
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}
				</CreateResourceLayout>
			</form>
		</Form>
	);
}
