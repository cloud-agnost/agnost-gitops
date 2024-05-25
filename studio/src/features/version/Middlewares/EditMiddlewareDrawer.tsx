import { useToast } from '@/hooks';
import useMiddlewareStore from '@/store/middleware/middlewareStore.ts';
import { APIError, MiddlewareSchema } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from 'components/Drawer';
import { Form } from 'components/Form';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import MiddlewareForm from './MiddlewareForm';

export default function EditMiddlewareDrawer() {
	const { t } = useTranslation();
	const { toast } = useToast();
	const {
		toEditMiddleware,
		closeEditMiddlewareModal,
		isEditMiddlewareModalOpen,
		updateMiddleware,
	} = useMiddlewareStore();

	const form = useForm<z.infer<typeof MiddlewareSchema>>({
		resolver: zodResolver(MiddlewareSchema),
		defaultValues: {
			name: toEditMiddleware?.name,
		},
	});

	useEffect(() => {
		if (isEditMiddlewareModalOpen && toEditMiddleware) {
			form.reset({
				name: toEditMiddleware.name,
			});
		}
	}, [isEditMiddlewareModalOpen]);

	const { mutate: updateMiddlewareMutation, isPending } = useMutation({
		mutationFn: updateMiddleware,
		onSuccess: () => {
			onOpenChange();
			toast({
				title: t('version.middleware.edit.success') as string,
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

	async function onSubmit(data: z.infer<typeof MiddlewareSchema>) {
		if (!toEditMiddleware) return;
		updateMiddlewareMutation({
			orgId: toEditMiddleware.orgId,
			appId: toEditMiddleware.appId,
			versionId: toEditMiddleware.versionId,
			mwId: toEditMiddleware._id,
			name: data.name,
		});
	}

	function onOpenChange() {
		closeEditMiddlewareModal();
		form.reset({
			name: '',
		});
	}

	return (
		<Drawer open={isEditMiddlewareModalOpen} onOpenChange={onOpenChange}>
			<DrawerContent className='flex gap-0 flex-col' position='right'>
				<DrawerHeader>
					<DrawerTitle>{t('version.middleware.edit.default')}</DrawerTitle>
				</DrawerHeader>
				<Form {...form}>
					<form className='p-6 flex flex-col gap-3 flex-1' onSubmit={form.handleSubmit(onSubmit)}>
						<MiddlewareForm loading={isPending} onSubmit={onSubmit} />
					</form>
				</Form>
			</DrawerContent>
		</Drawer>
	);
}
