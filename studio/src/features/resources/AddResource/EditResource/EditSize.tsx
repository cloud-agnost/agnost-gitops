import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { Input } from '@/components/Input';
import { useToast } from '@/hooks';
import useResourceStore from '@/store/resources/resourceStore';
import { APIError, CreateResourceSchema, ResourceUpdateType } from '@/types';
import { isEmpty } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from 'components/Form';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import * as z from 'zod';

export default function EditSize() {
	const {
		toggleCreateResourceModal,
		updateManagedResourceConfiguration,
		closeEditResourceModal,
		resourceToEdit,
	} = useResourceStore();
	const { toast } = useToast();
	const { t } = useTranslation();
	const { orgId } = useParams() as Record<string, string>;
	const form = useForm<z.infer<typeof CreateResourceSchema>>({
		resolver: zodResolver(CreateResourceSchema),
		defaultValues: {
			name: resourceToEdit.name,
			allowedRoles: resourceToEdit.allowedRoles,
			instance: resourceToEdit.instance,
			type: resourceToEdit.type,
			config: resourceToEdit.config,
		},
	});

	function onSuccess() {
		form.reset();
		if (isEmpty(resourceToEdit)) toggleCreateResourceModal();
		else closeEditResourceModal();
		toast({
			title: t('resources.edit_success') as string,
			action: 'success',
		});
	}
	function onError(error: APIError) {
		toast({
			title: error?.details,
			action: 'error',
		});
	}

	const { mutateAsync: updateResourceMutate, isPending } = useMutation({
		mutationFn: updateManagedResourceConfiguration,
		onSuccess,
		onError,
	});

	function onSubmit(data: z.infer<typeof CreateResourceSchema>) {
		updateResourceMutate({
			orgId,
			updateType: ResourceUpdateType.Size,
			resourceId: resourceToEdit?._id,
			...data,
		});
	}

	useEffect(() => {
		if (!isEmpty(resourceToEdit)) {
			form.reset({
				name: resourceToEdit.name,
				allowedRoles: resourceToEdit.allowedRoles,
				instance: resourceToEdit.instance,
				type: resourceToEdit.type,
				config: resourceToEdit.config,
			});
		}
	}, [resourceToEdit]);
	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className='flex items-center justify-center'>
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
							<FormDescription>{t('resources.database.storage_size_description')}</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button className='ml-2' size='lg' loading={isPending} type='submit'>
					{t('resources.update_size')}
				</Button>
			</form>
		</Form>
	);
}
