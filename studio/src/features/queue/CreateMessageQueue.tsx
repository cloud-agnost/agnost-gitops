import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Form } from '@/components/Form';
import { useTabNavigate, useToast } from '@/hooks';
import useMessageQueueStore from '@/store/queue/messageQueueStore';
import useVersionStore from '@/store/version/versionStore';
import { APIError, CreateMessageQueueSchema, TabTypes } from '@/types';
import { removeEmptyFields } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import * as z from 'zod';
import MessageQueueForm from './MessageQueueForm';

export default function CreateMessageQueue() {
	const { t } = useTranslation();
	const { createQueue, isCreateQueueModalOpen, toggleCreateModal } = useMessageQueueStore();
	const navigate = useTabNavigate();
	const { getVersionDashboardPath } = useVersionStore();
	const { versionId, appId, orgId } = useParams<{
		versionId: string;
		appId: string;
		orgId: string;
	}>();
	const { toast } = useToast();
	const form = useForm<z.infer<typeof CreateMessageQueueSchema>>({
		resolver: zodResolver(CreateMessageQueueSchema),
		defaultValues: {
			logExecution: false,
		},
	});

	const { mutateAsync: createQueueMutate, isPending } = useMutation({
		mutationFn: createQueue,
		mutationKey: ['updateQueue'],
		onSuccess: (queue) => {
			handleClose();
			navigate({
				title: queue.name,
				path: getVersionDashboardPath(`queue/${queue._id}`),
				isActive: true,
				isDashboard: false,
				type: TabTypes.MessageQueue,
			});
		},
		onError: ({ details }: APIError) => {
			handleClose();
			toast({ action: 'error', title: details });
		},
	});

	function onSubmit(data: z.infer<typeof CreateMessageQueueSchema>) {
		const params = removeEmptyFields(data) as z.infer<typeof CreateMessageQueueSchema>;
		createQueueMutate({
			orgId: orgId as string,
			appId: appId as string,
			versionId: versionId as string,
			...params,
			resourceId: data.resourceId,
		});
	}

	function handleClose() {
		form.reset();
		toggleCreateModal();
	}

	useEffect(() => {
		if (isCreateQueueModalOpen) {
			form.reset();
		}
	}, [isCreateQueueModalOpen]);
	return (
		<Drawer open={isCreateQueueModalOpen} onOpenChange={handleClose}>
			<DrawerContent position='right' size='lg' className='h-full'>
				<DrawerHeader>
					<DrawerTitle>{t('queue.create.title')}</DrawerTitle>
				</DrawerHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='p-6 scroll'>
						<MessageQueueForm loading={isPending} />
					</form>
				</Form>
			</DrawerContent>
		</Drawer>
	);
}
