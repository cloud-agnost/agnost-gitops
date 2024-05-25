import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { SettingsFormItem } from '@/components/SettingsFormItem';
import { API_SERVER_PARAM_REGEX, CPU_REGEX, MEMORY_REGEX } from '@/constants';
import { useAuthorizeVersion, useToast } from '@/hooks';
import useEnvironmentStore from '@/store/environment/environmentStore';
import { APIError } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from 'components/Form';
import { t } from 'i18next';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const APIServerFormSchema = z.object({
	minScale: z.coerce.number().int().min(0).default(1),
	maxScale: z.coerce.number().positive().int().min(1).default(1),
	scaleDownDelay: z.string().regex(API_SERVER_PARAM_REGEX, {
		message:
			t('forms.invalid', {
				label: t('version.scaleDownDelay'),
			}) ?? '',
	}),
	scaleToZeroPodRetentionPeriod: z.string().regex(API_SERVER_PARAM_REGEX),
	cpu: z.object({
		request: z.string().regex(CPU_REGEX, {
			message:
				t('forms.invalid', {
					label: t('version.cpuRequest'),
				}) ?? '',
		}),
		limit: z.string().regex(CPU_REGEX, {
			message:
				t('forms.invalid', {
					label: t('version.cpuLimit'),
				}) ?? '',
		}),
	}),
	memory: z.object({
		request: z.string().regex(MEMORY_REGEX, {
			message:
				t('forms.invalid', {
					label: t('version.memoryRequest'),
				}) ?? '',
		}),
		limit: z.string().regex(MEMORY_REGEX, {
			message:
				t('forms.invalid', {
					label: t('version.memoryLimit'),
				}) ?? '',
		}),
	}),
});
export default function UpdateAPIServer() {
	const { toast } = useToast();
	const canEdit = useAuthorizeVersion('version.update');
	const apiServer = useEnvironmentStore((state) =>
		state.resources.find((r) => r.type === 'engine'),
	);
	const { updateApiServerConf, environment } = useEnvironmentStore();
	const form = useForm<z.infer<typeof APIServerFormSchema>>({
		resolver: zodResolver(APIServerFormSchema),
		defaultValues: apiServer?.config,
	});
	const { mutateAsync: updateApiServerConfMutate, isPending } = useMutation({
		mutationFn: updateApiServerConf,
		onSuccess: () => {
			toast({
				title: t('version.apiServer_updated') ?? '',
				action: 'success',
			});
		},
		onError: (error: APIError) => {
			toast({
				title: error.details,
				action: 'error',
			});
		},
	});

	function onSubmit(data: z.infer<typeof APIServerFormSchema>) {
		updateApiServerConfMutate({
			orgId: apiServer?.orgId as string,
			appId: apiServer?.appId as string,
			versionId: apiServer?.versionId as string,
			envId: environment?._id,
			...data,
		});
	}

	useEffect(() => {
		form.reset(apiServer?.config);
	}, [apiServer?.config]);

	return (
		<SettingsFormItem
			className='space-y-0 py-6'
			contentClassName='pt-6'
			title={t('version.apiServer')}
			description={t('version.apiServer_desc')}
		>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 flex flex-col'>
					<FormDescription>{t('version.update_engine_desc')}</FormDescription>
					<div className='flex gap-8'>
						<FormField
							control={form.control}
							name='minScale'
							render={({ field }) => {
								return (
									<FormItem className='flex-1'>
										<FormLabel>{t('version.minReplicas')}</FormLabel>
										<FormControl>
											<Input
												type='number'
												error={!!form.formState.errors.minScale}
												placeholder={t('forms.placeholder', {
													label: t('version.minReplicas'),
												}).toString()}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								);
							}}
						/>
						<FormField
							control={form.control}
							name='maxScale'
							render={({ field }) => {
								return (
									<FormItem className='flex-1'>
										<FormLabel>{t('version.maxReplicas')}</FormLabel>
										<FormControl>
											<Input
												type='number'
												error={!!form.formState.errors.maxScale}
												placeholder={t('forms.placeholder', {
													label: t('version.maxReplicas'),
												}).toString()}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								);
							}}
						/>
					</div>
					<div className='flex gap-8'>
						<FormField
							control={form.control}
							name='scaleDownDelay'
							render={({ field }) => {
								return (
									<FormItem className='flex-1'>
										<FormLabel>{t('version.scaleDownDelay')}</FormLabel>
										<FormControl>
											<Input
												error={!!form.formState.errors.scaleDownDelay}
												placeholder={t('forms.placeholder', {
													label: t('version.scaleDownDelay'),
												}).toString()}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								);
							}}
						/>
						<FormField
							control={form.control}
							name='scaleToZeroPodRetentionPeriod'
							render={({ field }) => {
								return (
									<FormItem className='flex-1'>
										<FormLabel>{t('version.scaleToZeroPodRetentionPeriod')}</FormLabel>
										<FormControl>
											<Input
												error={!!form.formState.errors.scaleToZeroPodRetentionPeriod}
												placeholder={t('forms.placeholder', {
													label: t('version.scaleToZeroPodRetentionPeriod'),
												}).toString()}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								);
							}}
						/>
					</div>
					<div className='space-y-6'>
						<h6 className='text-sm leading-6 text-default tracking-tight font-medium'>
							{t('version.requestAndLimits')}
						</h6>
						<FormDescription>{t('version.request_Desc')}</FormDescription>
						<div className='flex gap-8'>
							<FormField
								control={form.control}
								name='cpu.request'
								render={({ field }) => {
									return (
										<FormItem className='flex-1'>
											<FormLabel>{t('version.cpuRequest')}</FormLabel>
											<FormControl>
												<Input
													error={!!form.formState.errors.cpu?.request}
													placeholder={t('forms.placeholder', {
														label: t('version.cpuRequest'),
													}).toString()}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									);
								}}
							/>
							<FormField
								control={form.control}
								name='cpu.limit'
								render={({ field }) => {
									return (
										<FormItem className='flex-1'>
											<FormLabel>{t('version.cpuLimit')}</FormLabel>
											<FormControl>
												<Input
													error={!!form.formState.errors.cpu?.limit}
													placeholder={t('forms.placeholder', {
														label: t('version.cpuLimit'),
													}).toString()}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									);
								}}
							/>
						</div>
						<div className='flex gap-8'>
							<FormField
								control={form.control}
								name='memory.request'
								render={({ field }) => {
									return (
										<FormItem className='flex-1'>
											<FormLabel>{t('version.memoryRequest')}</FormLabel>
											<FormControl>
												<Input
													error={!!form.formState.errors.memory?.request}
													placeholder={t('forms.placeholder', {
														label: t('version.memoryRequest'),
													}).toString()}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									);
								}}
							/>
							<FormField
								control={form.control}
								name='memory.limit'
								render={({ field }) => {
									return (
										<FormItem className='flex-1'>
											<FormLabel>{t('version.memoryLimit')}</FormLabel>
											<FormControl>
												<Input
													error={!!form.formState.errors.memory?.limit}
													placeholder={t('forms.placeholder', {
														label: t('version.memoryLimit'),
													}).toString()}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									);
								}}
							/>
						</div>
					</div>
					<Button
						type='submit'
						variant='primary'
						className='self-end'
						loading={isPending}
						disabled={!canEdit}
					>
						{t('general.save')}
					</Button>
				</form>
			</Form>
		</SettingsFormItem>
	);
}
