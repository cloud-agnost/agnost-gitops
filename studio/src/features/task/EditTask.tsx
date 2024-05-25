import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Form } from '@/components/Form';
import { useToast } from '@/hooks';
import useTaskStore from '@/store/task/taskStore';
import { APIError, CreateTaskSchema } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import * as z from 'zod';
import TaskForm from './TaskForm';

export default function EditTask() {
	const { t } = useTranslation();
	const { updateTask, toEditTask, isEditTaskModalOpen, closeEditTaskModal } = useTaskStore();
	const { toast } = useToast();
	const { versionId, appId, orgId } = useParams<{
		versionId: string;
		appId: string;
		orgId: string;
		taskId: string;
	}>();

	const form = useForm<z.infer<typeof CreateTaskSchema>>({
		resolver: zodResolver(CreateTaskSchema),
	});
	const { mutateAsync: updateTaskMutation, isPending } = useMutation({
		mutationFn: updateTask,
		onSuccess: () => {
			handleClose();
			toast({
				title: t('task.editLogicSuccess') as string,
				action: 'success',
			});
		},
		onError: ({ details }: APIError) => {
			toast({
				title: details,
				action: 'error',
			});
		},
	});
	function onSubmit(data: z.infer<typeof CreateTaskSchema>) {
		updateTaskMutation({
			orgId: orgId as string,
			appId: appId as string,
			versionId: versionId as string,
			taskId: toEditTask._id,
			...data,
		});
	}

	function handleClose() {
		closeEditTaskModal();
		form.reset();
	}

	useEffect(() => {
		if (toEditTask) {
			form.reset({
				...toEditTask,
				enabled: toEditTask.enabled ?? true,
			});
		}
	}, [toEditTask]);
	return (
		<Drawer open={isEditTaskModalOpen} onOpenChange={handleClose}>
			<DrawerContent position='right' size='lg' className='h-full'>
				<DrawerHeader>
					<DrawerTitle>
						{t('task.edit', {
							name: toEditTask.name,
						})}
					</DrawerTitle>
				</DrawerHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='p-6 scroll'>
						<TaskForm loading={isPending} />
					</form>
				</Form>
			</DrawerContent>
		</Drawer>
	);
}
