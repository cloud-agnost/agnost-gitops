import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Form } from '@/components/Form';
import { useToast } from '@/hooks';
import useModelStore from '@/store/database/modelStore';
import { APIError, ModelSchema } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import ModelForm from './ModelForm';

export default function EditModel() {
	const { t } = useTranslation();
	const { isEditModelDialogOpen, closeEditModelModal } = useModelStore();
	const form = useForm<z.infer<typeof ModelSchema>>({
		resolver: zodResolver(ModelSchema),
	});
	const { toast } = useToast();
	const { updateNameAndDescription, enableTimestamps, disableTimestamps, model } = useModelStore();
	const { versionId, appId, orgId, dbId } = useParams() as {
		versionId: string;
		appId: string;
		orgId: string;
		dbId: string;
	};
	const { mutateAsync: editModelMutation, isPending } = useMutation({
		mutationFn: editModelHandler,
		mutationKey: ['createModel'],
		onSuccess: () => {
			form.reset();
			closeEditModelModal();
			toast({
				title: t('database.models.edit_success') as string,
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

	function editModelHandler(data: z.infer<typeof ModelSchema>) {
		const updatedModel = updateNameAndDescription({
			dbId,
			appId,
			orgId,
			versionId,
			modelId: model._id,
			...data,
		});
		const timestampsChanged = model.timestamps.enabled !== data.timestamps.enabled;

		if (timestampsChanged) {
			const { dbId, appId, orgId, versionId, _id: modelId } = model;
			const { createdAt, updatedAt } = data.timestamps;
			if (data.timestamps.enabled) {
				enableTimestamps({ dbId, appId, orgId, versionId, modelId, createdAt, updatedAt });
			} else {
				disableTimestamps({ dbId, appId, orgId, versionId, modelId });
			}
		}
		return updatedModel;
	}

	async function onSubmit(data: z.infer<typeof ModelSchema>) {
		editModelMutation(data);
	}

	useEffect(() => {
		if (isEditModelDialogOpen && model) {
			form.reset({
				name: model.name,
				description: model.description,
				timestamps: {
					enabled: model.timestamps.enabled,
					createdAt: model.timestamps.createdAt,
					updatedAt: model.timestamps.updatedAt,
				},
			});
		}
	}, [isEditModelDialogOpen, model]);

	useEffect(() => {
		form.clearErrors('timestamps');
	}, [form.getValues('timestamps.enabled')]);

	return (
		<Drawer open={isEditModelDialogOpen} onOpenChange={closeEditModelModal}>
			<DrawerContent className='overflow-x-hidden'>
				<DrawerHeader className='relative'>
					<DrawerTitle>{t('database.models.create')}</DrawerTitle>
				</DrawerHeader>
				<div className='p-6 space-y-6'>
					<Form {...form}>
						<form className='space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
							<ModelForm editMode loading={isPending} />
						</form>
					</Form>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
