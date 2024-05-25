import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Form } from '@/components/Form';
import { useToast } from '@/hooks';
import useEnvironmentStore from '@/store/environment/environmentStore';
import useMessageQueueStore from '@/store/queue/messageQueueStore';
import { APIError, MessageQueueSchema } from '@/types';
import { removeEmptyFields } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import * as z from 'zod';
import MessageQueueForm from './MessageQueueForm';

export default function EditMessageQueue() {
	const { t } = useTranslation();
	const { updateQueue, toEditQueue, isEditQueueModalOpen, closeEditQueueModal } =
		useMessageQueueStore();
	const environment = useEnvironmentStore((state) => state.environment);
	const { versionId, appId, orgId } = useParams() as Record<string, string>;
	const { toast } = useToast();
	const form = useForm<z.infer<typeof MessageQueueSchema>>({
		resolver: zodResolver(MessageQueueSchema),
	});

	const { mutateAsync: updateQueueMutate, isPending } = useMutation({
		mutationFn: updateQueue,
		mutationKey: ['updateQueue'],
		onSuccess: () => {
			closeEditQueueModal();
			toast({
				title: t('queue.edit_success') as string,
				action: 'success',
			});
		},
		onError: ({ details }: APIError) => {
			toast({ action: 'error', title: details });
		},
	});
	function onSubmit(data: z.infer<typeof MessageQueueSchema>) {
		const params = removeEmptyFields(data) as z.infer<typeof MessageQueueSchema>;
		updateQueueMutate({
			orgId: orgId,
			appId: appId,
			versionId: versionId,
			queueId: toEditQueue._id,
			...params,
		});
	}

	useEffect(() => {
		if (toEditQueue) {
			form.reset(toEditQueue);
		}
	}, [isEditQueueModalOpen, toEditQueue, environment]);

	return (
		<Drawer open={isEditQueueModalOpen} onOpenChange={closeEditQueueModal}>
			<DrawerContent position='right' size='lg' className='h-full'>
				<DrawerHeader>
					<DrawerTitle>
						{t('queue.edit', {
							name: toEditQueue?.name,
						})}
					</DrawerTitle>
				</DrawerHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='p-6 scroll'>
						<MessageQueueForm loading={isPending} edit />
					</form>
				</Form>
			</DrawerContent>
		</Drawer>
	);
}
