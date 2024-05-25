import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Form } from '@/components/Form';
import { useTabNavigate, useToast } from '@/hooks';
import useStorageStore from '@/store/storage/storageStore';
import useVersionStore from '@/store/version/versionStore';
import { APIError, CreateStorageSchema, TabTypes } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import * as z from 'zod';
import StorageForm from './StorageForm';

export default function CreateStorage() {
	const { t } = useTranslation();
	const { createStorage, isCreateStorageModalOpen, toggleCreateModal } = useStorageStore();
	const { getVersionDashboardPath } = useVersionStore();
	const { versionId, appId, orgId } = useParams<{
		versionId: string;
		appId: string;
		orgId: string;
	}>();
	const { toast } = useToast();
	const navigate = useTabNavigate();
	const form = useForm<z.infer<typeof CreateStorageSchema>>({
		resolver: zodResolver(CreateStorageSchema),
	});
	const { mutateAsync: createMutation, isPending } = useMutation({
		mutationFn: createStorage,
		onSuccess: (storage) => {
			onCloseHandler();
			navigate({
				title: storage.name,
				path: getVersionDashboardPath(`storage/${storage._id}`),
				isActive: true,
				isDashboard: false,
				type: TabTypes.Bucket,
			});
			useStorageStore.setState({ buckets: [] });
		},
		onError: ({ details }: APIError) => {
			toast({ action: 'error', title: details });
		},
	});

	function onSubmit(data: z.infer<typeof CreateStorageSchema>) {
		createMutation({
			orgId: orgId as string,
			appId: appId as string,
			versionId: versionId as string,
			...data,
		});
	}

	function onCloseHandler() {
		form.reset();
		toggleCreateModal();
	}

	useEffect(() => {
		if (isCreateStorageModalOpen) {
			form.reset();
		}
	}, [isCreateStorageModalOpen]);
	return (
		<Drawer open={isCreateStorageModalOpen} onOpenChange={onCloseHandler}>
			<DrawerContent position='right' size='lg' className='h-full'>
				<DrawerHeader>
					<DrawerTitle>{t('storage.create')}</DrawerTitle>
				</DrawerHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='p-6 scroll'>
						<StorageForm loading={isPending} />
					</form>
				</Form>
			</DrawerContent>
		</Drawer>
	);
}
