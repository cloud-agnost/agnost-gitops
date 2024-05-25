import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Form } from '@/components/Form';
import { useToast } from '@/hooks';
import useDatabaseStore from '@/store/database/databaseStore';
import useModelStore from '@/store/database/modelStore';
import { APIError, ModelSchema, ResourceInstances } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import ModelForm from './ModelForm';

export default function CreateModel() {
	const { t } = useTranslation();
	const { toast } = useToast();
	const { database } = useDatabaseStore();
	const { isCreateModelDialogOpen, toggleCreateModal } = useModelStore();
	const form = useForm<z.infer<typeof ModelSchema>>({
		resolver: zodResolver(ModelSchema),
		defaultValues: {
			timestamps: {
				createdAt: database.type === ResourceInstances.MongoDB ? 'createdAt' : 'created_at',
				updatedAt: database.type === ResourceInstances.MongoDB ? 'updatedAt' : 'updated_at',
			},
		},
	});
	const { versionId, appId, orgId, dbId } = useParams() as {
		versionId: string;
		appId: string;
		orgId: string;
		dbId: string;
	};
	const { createModel } = useModelStore();

	const { mutateAsync: createModelMutation, isPending } = useMutation({
		mutationFn: createModel,
		mutationKey: ['createModel'],
		onError: (error: APIError) => {
			toast({
				title: error.details,
				action: 'error',
			});
		},
		onSuccess: onClose,
	});
	async function onSubmit(data: z.infer<typeof ModelSchema>) {
		createModelMutation({
			versionId,
			appId,
			orgId,
			dbId,
			...data,
		});
	}
	function onClose() {
		form.reset({
			name: '',
			description: '',
		});
		toggleCreateModal();
	}

	useEffect(() => {
		if (isCreateModelDialogOpen) {
			form.reset({
				timestamps: {
					createdAt: database.type === ResourceInstances.MongoDB ? 'createdAt' : 'created_at',
					updatedAt: database.type === ResourceInstances.MongoDB ? 'updatedAt' : 'updated_at',
				},
			});
		}
	}, [isCreateModelDialogOpen]);

	return (
		<Drawer open={isCreateModelDialogOpen} onOpenChange={onClose}>
			<DrawerContent className='overflow-x-hidden'>
				<DrawerHeader className='relative'>
					<DrawerTitle>{t('database.models.create')}</DrawerTitle>
				</DrawerHeader>
				<div className='p-6 space-y-6'>
					<Form {...form}>
						<form className='space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
							<ModelForm loading={isPending} />
						</form>
					</Form>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
