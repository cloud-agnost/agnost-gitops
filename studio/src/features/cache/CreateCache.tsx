import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Form } from '@/components/Form';
import { useToast } from '@/hooks';
import useCacheStore from '@/store/cache/cacheStore';
import { APIError, CreateCacheSchema } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import * as z from 'zod';
import CacheForm from './CacheForm';

export default function CreateCache() {
	const { t } = useTranslation();
	const { createCache, isCreateCacheModalOpen, toggleCreateModal } = useCacheStore();
	const { versionId, appId, orgId } = useParams<{
		versionId: string;
		appId: string;
		orgId: string;
	}>();
	const { toast } = useToast();
	const form = useForm<z.infer<typeof CreateCacheSchema>>({
		resolver: zodResolver(CreateCacheSchema),
		defaultValues: {
			assignUniqueName: true,
		},
	});
	function resetAndClose() {
		form.reset();
		toggleCreateModal();
	}

	const { mutateAsync: crateMutate, isPending } = useMutation({
		mutationFn: createCache,
		onSuccess: () => {
			resetAndClose();
		},
		onError: ({ details }: APIError) => {
			toast({ action: 'error', title: details });
		},
	});

	function onSubmit(data: z.infer<typeof CreateCacheSchema>) {
		crateMutate({
			orgId: orgId as string,
			appId: appId as string,
			versionId: versionId as string,
			...data,
		});
	}

	useEffect(() => {
		if (isCreateCacheModalOpen) {
			form.reset();
		}
	}, [isCreateCacheModalOpen]);

	return (
		<Drawer open={isCreateCacheModalOpen} onOpenChange={resetAndClose}>
			<DrawerContent position='right' size='lg' className='h-full'>
				<DrawerHeader>
					<DrawerTitle>{t('cache.create')}</DrawerTitle>
				</DrawerHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='p-6 scroll'>
						<CacheForm loading={isPending} />
					</form>
				</Form>
			</DrawerContent>
		</Drawer>
	);
}
