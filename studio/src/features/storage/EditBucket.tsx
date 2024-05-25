import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Form } from '@/components/Form';
import { useToast } from '@/hooks';
import useStorageStore from '@/store/storage/storageStore';
import { APIError, BucketSchema } from '@/types';
import { arrayToObj, objToArray, stringifyObjectValues } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import BucketForm from './BucketForm';

interface EditStorageProps {
	open: boolean;
	onClose: () => void;
}

export default function EditBucket({ open, onClose }: EditStorageProps) {
	const { t } = useTranslation();
	const { updateBucket, bucket, storage } = useStorageStore();
	const { toast } = useToast();
	const form = useForm<z.infer<typeof BucketSchema>>({
		resolver: zodResolver(BucketSchema),
	});

	function resetForm() {
		form.reset({
			name: '',
			isPublic: true,
			tags: [],
		});
		onClose();
	}

	useEffect(() => {
		if (bucket.name) {
			form.reset({
				name: bucket.name,
				isPublic: bucket.isPublic,
				tags: objToArray(stringifyObjectValues(bucket.tags)),
			});
		}
	}, [bucket]);

	const { mutateAsync: updateMutation, isPending } = useMutation({
		mutationFn: updateBucket,
		onSuccess: () => {
			resetForm();
			toast({
				title: t('storage.bucket.edit_success') as string,
				action: 'success',
			});
		},
		onError: ({ details }: APIError) => {
			toast({ action: 'error', title: details });
		},
	});

	function onSubmit(data: z.infer<typeof BucketSchema>) {
		updateMutation({
			storageName: storage.name as string,
			bucketName: bucket.name as string,
			versionId: storage.versionId as string,
			...data,
			tags: arrayToObj(data.tags?.filter((tag) => tag.key && tag.value) as any),
		});
	}
	return (
		<Drawer open={open} onOpenChange={() => resetForm()}>
			<DrawerContent position='right' size='lg' className='h-full'>
				<DrawerHeader>
					<DrawerTitle>
						{t('storage.edit', {
							name: storage.name,
						})}
					</DrawerTitle>
				</DrawerHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='p-6 scroll'>
						<BucketForm loading={isPending} />
					</form>
				</Form>
			</DrawerContent>
		</Drawer>
	);
}
