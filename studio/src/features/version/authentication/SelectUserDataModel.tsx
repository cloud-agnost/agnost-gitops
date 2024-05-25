import { Alert, AlertDescription, AlertTitle } from '@/components/Alert';
import { Button } from '@/components/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import { SettingsFormItem } from '@/components/SettingsFormItem';
import { FIELD_ICON_MAP, RESOURCE_ICON_MAP } from '@/constants';
import { useAuthorizeVersion, useToast, useUpdateEffect } from '@/hooks';
import useDatabaseStore from '@/store/database/databaseStore';
import useModelStore from '@/store/database/modelStore';
import useSettingsStore from '@/store/version/settingsStore';
import useVersionStore from '@/store/version/versionStore';
import { APIError } from '@/types';
import { cn, isEmpty, translate as t } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from 'components/Form';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const SaveUserModelSchema = z.object({
	databaseId: z.string({
		required_error: t('forms.required', {
			label: t('resources.type.database'),
		}),
	}),
	modelId: z.string({
		required_error: t('forms.required', {
			label: t('version.authentication.model'),
		}),
	}),
});

export default function SelectUserDataModel() {
	const { saveUserDataModelInfo, addMissingUserDataModelFields } = useSettingsStore();
	const { version } = useVersionStore();
	const { databases, getDatabases } = useDatabaseStore();
	const { getModels, models: dbModels } = useModelStore();

	const [error, setError] = useState<APIError>();
	const { toast } = useToast();
	const canEdit = useAuthorizeVersion('version.auth.update');
	const form = useForm<z.infer<typeof SaveUserModelSchema>>({
		resolver: zodResolver(SaveUserModelSchema),
	});
	const models = useMemo(() => {
		if (!_.isEmpty(dbModels)) {
			return dbModels[form.watch('databaseId')] ?? [];
		}
	}, [form.watch('databaseId'), dbModels]);

	useEffect(() => {
		if (version && isEmpty(databases)) {
			getDatabases({
				orgId: version.orgId,
				versionId: version._id,
				appId: version.appId,
			});
		}
	}, [version]);
	useEffect(() => {
		const dbId = form.watch('databaseId');
		if (version && dbId) {
			getModels({
				orgId: version.orgId,
				versionId: version._id,
				appId: version.appId,
				dbId,
			});
		}
	}, [form.watch('databaseId')]);

	function getDatabaseIcon(type: string): React.ReactNode {
		const Icon = RESOURCE_ICON_MAP[type];
		return <Icon className='w-4 h-4' />;
	}
	function getFieldIcon(type: string): React.ReactNode {
		const Icon = FIELD_ICON_MAP[type];
		return <Icon className='w-6 h-6 text-elements-strong-red' />;
	}
	const { mutateAsync, isPending } = useMutation({
		mutationFn: saveUserDataModelInfo,
		mutationKey: ['saveUserDataModelInfo'],
		onSuccess: () => {
			toast({
				title: t('version.authentication.user_data_model_saved'),
				action: 'success',
			});
		},
		onError: (error: APIError) => {
			setError(error);

			toast({
				title: error.details,
				action: 'error',
			});
		},
	});
	const { mutateAsync: addMissingFieldsMutation, isPending: isLoadingAddFields } = useMutation({
		mutationFn: addMissingUserDataModelFields,
		mutationKey: ['addMissingUserDataModelFields'],
		onSuccess: () => {
			toast({
				title: t('version.authentication.added_missing_fields'),
				action: 'success',
			});
			setError(undefined);
		},
		onError: (error: APIError) => {
			toast({
				title: error.details,
				action: 'error',
			});
		},
	});
	function onSubmit(data: z.infer<typeof SaveUserModelSchema>) {
		mutateAsync({
			orgId: version?.orgId,
			versionId: version?._id,
			appId: version?.appId,
			...data,
			onSuccess: () => {
				toast({
					title: t('version.authentication.user_data_model_saved'),
					action: 'success',
				});
			},
		});
	}
	function addMissingFields() {
		addMissingFieldsMutation({
			orgId: version?.orgId,
			versionId: version?._id,
			appId: version?.appId,
			...form.getValues(),
		});
	}

	useEffect(() => {
		const dbId = form.watch('databaseId');
		const modelId = form.watch('modelId');
		if (version && (!dbId || !modelId)) {
			const dId = databases?.find(
				(db) => db.iid === version?.authentication?.userDataModel?.database,
			)?._id;

			form.setValue('databaseId', dId as string);
		}
	}, [version, databases]);

	useUpdateEffect(() => {
		if (models?.length) {
			const dbId = form.watch('databaseId');
			const modelId = form.watch('modelId');
			if (version && (!dbId || !modelId)) {
				const mId = models?.find(
					(model) => model.iid === version?.authentication?.userDataModel?.model,
				)?._id;

				form.reset({
					databaseId: dbId,
					modelId: mId,
				});
			}
		}
	}, [version, models]);
	return (
		<SettingsFormItem
			className='py-0'
			contentClassName='space-y-6'
			title={t('version.authentication.user_data_model')}
			description={t('version.authentication.user_data_model_desc')}
		>
			{!!error?.missingFields?.length && (
				<Alert variant='error'>
					<AlertTitle className=' text-elements-red'>{error?.error}</AlertTitle>
					<AlertDescription className='space-y-6'>
						<p className='text-elements-subtle-red'>{error?.details}</p>
						<div className='space-y-4'>
							{error?.missingFields?.map((field) => {
								return (
									<div key={field.name} className='space-y-2'>
										<div className='flex items-center gap-4'>
											{getFieldIcon(field.type)}
											<p className='text-elements-red font-sfCompact text-sm'>
												{field.name}{' '}
												<span className='text-elements-subtle-red'>({field.type})</span>
											</p>
										</div>
										<p className='text-elements-subtle-red'>
											{t(`version.authentication.${field.name}`)}
										</p>
									</div>
								);
							})}
						</div>
						<Button size='2xl' onClick={addMissingFields} loading={isLoadingAddFields}>
							{!isLoadingAddFields && <Plus weight='bold' className='mr-2' />}
							{t('version.authentication.add_missing_fields')}
						</Button>
					</AlertDescription>
				</Alert>
			)}
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className='flex-1 flex flex-col gap-6'>
					<div className='flex  gap-4 flex-1'>
						<FormField
							control={form.control}
							name='databaseId'
							render={({ field, formState: { errors } }) => (
								<FormItem className='space-y-1 flex-1'>
									<FormLabel>{t('resources.type.database')}</FormLabel>
									<FormControl>
										<Select
											defaultValue={field.value}
											value={field.value}
											name={field.name}
											onValueChange={(value) => {
												field.onChange(value);
												form.resetField('modelId');
											}}
										>
											<FormControl>
												<SelectTrigger
													className={cn('w-full flex-1', errors.databaseId && 'input-error')}
												>
													<SelectValue
														className={cn('text-subtle')}
														placeholder={`${t('general.select')} ${t('resources.type.database')}`}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent align='center'>
												{databases.map((db) => {
													return (
														<SelectItem
															className='px-3 py-[6px] w-full max-w-full cursor-pointer'
															key={db._id}
															value={db._id}
														>
															<div className='flex items-center gap-2'>
																{getDatabaseIcon(db.type)}
																{db.name}
															</div>
														</SelectItem>
													);
												})}
												{!databases.length && (
													<SelectItem value='' disabled>
														{t('database.no_database')}
													</SelectItem>
												)}
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							disabled={!form.watch('databaseId')}
							control={form.control}
							name='modelId'
							render={({ field, formState: { errors } }) => (
								<FormItem className='space-y-1 flex-1'>
									<FormLabel className={cn(!form.watch('databaseId') && 'text-disabled')}>
										{t('version.authentication.model')}
									</FormLabel>
									<FormControl>
										<Select
											defaultValue={field.value}
											value={field.value}
											name={field.name}
											onValueChange={field.onChange}
											disabled={!form.watch('databaseId')}
										>
											<FormControl>
												<SelectTrigger
													className={cn('w-full input', errors.modelId && 'input-error')}
												>
													<SelectValue
														className={cn('text-subtle')}
														placeholder={`${t('general.select')} ${t(
															'version.authentication.model',
														)}`}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent align='center'>
												{models?.map((model) => {
													return (
														<SelectItem
															className='px-3 py-[6px] w-full max-w-full cursor-pointer'
															key={model._id}
															value={model._id}
														>
															<div className='flex items-center gap-2'>{model.name}</div>
														</SelectItem>
													);
												})}
												{!models?.length && (
													<SelectItem value='' disabled>
														{t('database.no_model')}
													</SelectItem>
												)}
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<Button
						type='submit'
						className='ml-auto self-end'
						size='lg'
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
