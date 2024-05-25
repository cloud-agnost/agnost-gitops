import { APIServerAlert } from '@/components/APIServerAlert';
import { Button } from '@/components/Button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Logs } from '@/components/Log';
import { Separator } from '@/components/Separator';
import { useToast } from '@/hooks';
import useTaskStore from '@/store/task/taskStore';
import useUtilsStore from '@/store/version/utilsStore';
import { APIError, Log } from '@/types';
import { generateId, joinChannel, leaveChannel } from '@/utils';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
interface TestTaskProps {
	open: boolean;
	onClose: () => void;
}
export default function TestTask({ open, onClose }: TestTaskProps) {
	const { t } = useTranslation();
	const { task, testTask } = useTaskStore();
	const { taskLogs } = useUtilsStore();
	const { toast } = useToast();
	const [debugChannel, setDebugChannel] = useState<string>('');
	const { versionId, appId, orgId, taskId } = useParams<{
		versionId: string;
		appId: string;
		orgId: string;
		taskId: string;
	}>();
	const { mutateAsync: testTaskMutation, isPending } = useMutation({
		mutationFn: testTask,
		onError: ({ details }: APIError) => {
			toast({
				title: details,
				action: 'error',
			});
		},
	});
	function testTaskHandler() {
		if (debugChannel) leaveChannel(debugChannel);
		const id = generateId();
		setDebugChannel(id);
		joinChannel(id);
		testTaskMutation({
			orgId: orgId as string,
			appId: appId as string,
			versionId: versionId as string,
			taskId: taskId as string,
			debugChannel: id,
		});
	}
	function handleClose() {
		if (debugChannel) leaveChannel(debugChannel);
		onClose();
	}
	return (
		<Drawer open={open} onOpenChange={handleClose}>
			<DrawerContent position='right' size='lg' className='h-full'>
				<DrawerHeader>
					<DrawerTitle>
						{t('task.test', {
							name: task.name,
						})}
					</DrawerTitle>
				</DrawerHeader>
				<div className='p-4 space-y-6 flex flex-col flex-1 h-full overflow-auto'>
					<APIServerAlert />
					<div className='flex items-center justify-between'>
						<span className='text-sm font-semibold text-default'>{task.name}</span>
						<Button variant='primary' onClick={testTaskHandler} loading={isPending}>
							{t('task.run')}
						</Button>
					</div>
					<Separator />
					<div className='flex-1 overflow-auto'>
						<Logs logs={taskLogs?.[taskId as string] as Log[]} />
					</div>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
