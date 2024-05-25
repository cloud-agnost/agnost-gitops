import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Form } from '@/components/Form';
import { useTabNavigate, useToast } from '@/hooks';
import useResourceStore from '@/store/resources/resourceStore';
import useTaskStore from '@/store/task/taskStore';
import useVersionStore from '@/store/version/versionStore';
import { APIError, CreateTaskSchema, TabTypes } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import * as z from 'zod';
import TaskForm from './TaskForm';

export default function CreateTask() {
	const { t } = useTranslation();
	const { createTask, isCreateTaskModalOpen, toggleCreateModal } = useTaskStore();
	const { toast } = useToast();
	const { resources } = useResourceStore();
	const navigate = useTabNavigate();
	const form = useForm<z.infer<typeof CreateTaskSchema>>({
		resolver: zodResolver(CreateTaskSchema),
		defaultValues: {
			logExecution: false,
			enabled: true,
		},
	});
	const { getVersionDashboardPath } = useVersionStore();
	const { versionId, appId, orgId } = useParams<{
		versionId: string;
		appId: string;
		orgId: string;
	}>();
	const { getResources } = useResourceStore();

	useEffect(() => {
		if (isCreateTaskModalOpen) {
			getResources({
				orgId: orgId as string,
				type: 'scheduler',
			});
			form.reset();
		}
	}, [isCreateTaskModalOpen]);

	const { mutateAsync: createTaskMutate, isPending } = useMutation({
		mutationFn: createTask,
		onSuccess: (task) => {
			navigate({
				title: task.name,
				path: getVersionDashboardPath(`task/${task._id}`),
				isActive: true,
				isDashboard: false,
				type: TabTypes.Task,
			});

			handleClose();
		},
		onError: ({ details }: APIError) => {
			toast({ action: 'error', title: details });
		},
	});
	function onSubmit(data: z.infer<typeof CreateTaskSchema>) {
		createTaskMutate({
			...data,
			orgId: orgId as string,
			appId: appId as string,
			versionId: versionId as string,
			resourceId: resources[0]._id,
		});
	}

	function handleClose() {
		form.reset();
		toggleCreateModal();
	}

	return (
		<Drawer open={isCreateTaskModalOpen} onOpenChange={handleClose}>
			<DrawerContent position='right' size='lg' className='h-full'>
				<DrawerHeader>
					<DrawerTitle>{t('task.add')}</DrawerTitle>
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
