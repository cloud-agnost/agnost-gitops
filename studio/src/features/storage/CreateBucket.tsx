import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Form } from '@/components/Form';
import { useToast } from '@/hooks';
import useStorageStore from '@/store/storage/storageStore';
import { BucketSchema } from '@/types';
import { arrayToObj } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import BucketForm from './BucketForm';
interface CreateStorageProps {
	open: boolean;
	onClose: () => void;
}

export default function CreateBucket({ open, onClose }: CreateStorageProps) {
	const form = useForm<z.infer<typeof BucketSchema>>({
		resolver: zodResolver(BucketSchema),
	});
	const { t } = useTranslation();
	const { createBucket, storage } = useStorageStore();
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();
	function onSubmit(data: z.infer<typeof BucketSchema>) {
		setLoading(true);
		createBucket({
			storageName: storage?.name as string,
			versionId: storage.versionId as string,
			...data,
			tags: arrayToObj(data.tags?.filter((tag) => tag.key && tag.value) as any),
			onSuccess: () => {
				form.reset({
					name: '',
					isPublic: true,
				});
				onClose();
				setLoading(false);
			},
			onError: ({ details }) => {
				setLoading(false);
				toast({ action: 'error', title: details });
			},
		});
	}
	return (
		<Drawer
			open={open}
			onOpenChange={() => {
				form.reset({
					name: '',
					isPublic: true,
				});
				onClose();
			}}
		>
			<DrawerContent position='right' size='lg' className='h-full'>
				<DrawerHeader>
					<DrawerTitle>{t('storage.bucket.create')}</DrawerTitle>
				</DrawerHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='p-6 scroll'>
						<BucketForm loading={loading} />
					</form>
				</Form>
			</DrawerContent>
		</Drawer>
	);
}
