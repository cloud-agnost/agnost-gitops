import { Button } from '@/components/Button';
import { DrawerClose, DrawerFooter } from '@/components/Drawer';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
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
import { Switch } from '@/components/Switch';
import useStorageStore from '@/store/storage/storageStore';
import { FileSchema } from '@/types';
import { cn, isEmpty, arrayToObj, objToArray, stringifyObjectValues } from '@/utils';
import { Plus, Trash } from '@phosphor-icons/react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import { useToast } from '@/hooks';
import { useEffect } from 'react';
interface EditFileProps {
	open: boolean;
	onClose: () => void;
}

export default function EditFile({ open, onClose }: EditFileProps) {
	const { updateFileInBucket, storage, bucket, file } = useStorageStore();

	const form = useForm<z.infer<typeof FileSchema>>({
		defaultValues: {
			path: file.path,
			isPublic: file.isPublic,
			tags: objToArray(stringifyObjectValues(file.tags)),
		},
	});

	const { t } = useTranslation();
	const { toast } = useToast();
	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'tags',
	});
	function resetForm() {
		form.reset({
			path: '',
			isPublic: true,
			tags: [],
		});
		onClose();
	}

	function onSubmit(data: z.infer<typeof FileSchema>) {
		updateFileInBucket({
			bckId: bucket.id,
			storageName: storage.name,
			bucketName: bucket.name,
			...data,
			tags: arrayToObj(data.tags?.filter((tag) => tag.key && tag.value) as any),
			filePath: file.path,
			onSuccess: () => {
				resetForm();
			},
			onError: ({ details }) => {
				toast({ action: 'error', title: details });
			},
		});
	}

	useEffect(() => {
		if (file.tags) {
			objToArray(file.tags).forEach((tag) => {
				append(tag);
			});
		}
	}, [file.tags]);

	useEffect(() => {
		if (open) {
			form.reset({
				path: file.path,
				isPublic: file.isPublic,
				tags: objToArray(file.tags),
			});
		} else {
			form.reset({
				path: '',
				isPublic: true,
				tags: [],
			});
		}
	}, [open]);

	return (
		<Drawer open={open} onOpenChange={() => resetForm()}>
			<DrawerContent position='right' size='lg' className='h-full'>
				<DrawerHeader>
					<DrawerTitle>{t('storage.file.edit')}</DrawerTitle>
				</DrawerHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='p-6 scroll'>
						<div className='space-y-6'>
							<FormField
								control={form.control}
								name='path'
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('storage.file.path')}</FormLabel>
										<FormControl>
											<Input
												error={Boolean(form.formState.errors.path)}
												placeholder={
													t('forms.placeholder', {
														label: t('storage.file.path'),
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
							<div className='space-y-4'>
								<FormLabel>
									<p>{t('storage.bucket.tags')}</p>
								</FormLabel>
								{fields.map((f, index) => (
									<div className='flex gap-4' key={f.id}>
										<FormField
											control={form.control}
											name={`tags.${index}.key`}
											render={({ field }) => (
												<FormItem className='flex-1'>
													{index === 0 && <FormLabel>{t('resources.database.key')}</FormLabel>}
													<FormControl>
														<Input
															placeholder={
																t('forms.placeholder', {
																	label: t('resources.database.key'),
																}) ?? ''
															}
															error={!!form.formState.errors.tags?.[index]?.key}
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name={`tags.${index}.value`}
											render={({ field }) => (
												<FormItem className='flex-1'>
													{index === 0 && <FormLabel>{t('resources.database.value')}</FormLabel>}

													<Input
														placeholder={
															t('forms.placeholder', {
																label: t('resources.database.value'),
															}) ?? ''
														}
														error={!!form.formState.errors.tags?.[index]?.value}
														{...field}
													/>
													<FormMessage />
												</FormItem>
											)}
										/>
										<Button
											variant='icon'
											size='sm'
											className={cn(
												'rounded-full',
												!index && 'self-end',
												!isEmpty(form.formState.errors) && !index && 'self-center mt-2',
												!isEmpty(form.formState.errors) &&
													isEmpty(form.formState.errors.tags?.[0]) &&
													!index &&
													'self-end',
											)}
											onClick={() => {
												remove(index);
											}}
										>
											<Trash size={16} className='text-subtle' />
										</Button>
									</div>
								))}
								<div className='flex justify-between items-center mt-8'>
									{fields.length < 50 && (
										<Button
											variant='text'
											onClick={() => {
												append({ key: '', value: '' });
											}}
										>
											<Plus size={16} className='text-brand-primary' />
											<span className='text-brand-primary ml-2'>
												{t('general.add_another_one')}
											</span>
										</Button>
									)}
								</div>
							</div>

							<FormField
								control={form.control}
								name='isPublic'
								render={({ field }) => (
									<FormItem className='flex justify-between gap-4 items-center space-y-0'>
										<FormLabel>
											<p>{t('storage.bucket.visibility.title')}</p>
											<p className='text-subtle'>{t('storage.bucket.visibility.desc')}</p>
										</FormLabel>
										<FormControl>
											<Switch checked={field.value} onCheckedChange={field.onChange} />
										</FormControl>
									</FormItem>
								)}
							/>

							<DrawerFooter className='mt-8'>
								<div className='flex justify-end'>
									<DrawerClose asChild>
										<Button variant='secondary' size='lg'>
											{t('general.cancel')}
										</Button>
									</DrawerClose>
									<Button className='ml-2' type='submit' size='lg'>
										{t('general.save')}
									</Button>
								</div>
							</DrawerFooter>
						</div>
					</form>
				</Form>
			</DrawerContent>
		</Drawer>
	);
}
