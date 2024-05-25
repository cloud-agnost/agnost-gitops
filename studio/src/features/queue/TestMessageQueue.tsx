import { APIServerAlert } from '@/components/APIServerAlert';
import { Button } from '@/components/Button';
import { CodeEditor } from '@/components/CodeEditor';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/Form';
import { Logs } from '@/components/Log';
import { Resizer } from '@/components/Resizer';
import { Separator } from '@/components/Separator';
import { useToast } from '@/hooks';
import useMessageQueueStore from '@/store/queue/messageQueueStore';
import useUtilsStore from '@/store/version/utilsStore';
import { APIError, Log } from '@/types';
import { generateId, joinChannel, leaveChannel, parseIfString } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Panel, PanelGroup } from 'react-resizable-panels';
import { useParams } from 'react-router-dom';
import * as z from 'zod';

interface TestMessageQueueProps {
	open: boolean;
	onClose: () => void;
}
export const TestMessageQueueSchema = z.object({
	payload: z.any().optional().default(null),
});
export default function TestMessageQueue({ open, onClose }: TestMessageQueueProps) {
	const { t } = useTranslation();
	const { queue, testQueue } = useMessageQueueStore();
	const { testQueueLogs } = useUtilsStore();
	const { toast } = useToast();
	const [debugChannel, setDebugChannel] = useState<string>('');
	const { versionId, appId, orgId, queueId } = useParams<{
		versionId: string;
		appId: string;
		orgId: string;
		queueId: string;
	}>();
	const form = useForm({
		resolver: zodResolver(TestMessageQueueSchema),
		defaultValues: {
			payload: testQueueLogs?.[queue?._id]?.payload,
		},
	});
	const { mutateAsync: testQueueMutation, isPending } = useMutation({
		mutationFn: testQueue,
		onError: ({ details }: APIError) => {
			toast({
				title: details,
				action: 'error',
			});
		},
	});
	function onSubmit(data: z.infer<typeof TestMessageQueueSchema>) {
		if (debugChannel) leaveChannel(debugChannel);
		const id = generateId();
		setDebugChannel(id);
		joinChannel(id);
		testQueueMutation({
			orgId: orgId as string,
			appId: appId as string,
			versionId: versionId as string,
			queueId: queueId as string,
			debugChannel: id,
			payload: parseIfString(data.payload),
		});
	}
	function handleClose() {
		if (debugChannel) leaveChannel(debugChannel);
		onClose();
		form.reset();
	}

	function stringifyIfObject(value: any) {
		if (typeof value === 'object') return JSON.stringify(value, null, 2);
		return value;
	}

	useEffect(() => {
		if (open) {
			form.setValue('payload', testQueueLogs?.[queue?._id]?.payload);
		}
	}, [open]);
	return (
		<Drawer open={open} onOpenChange={handleClose}>
			<DrawerContent position='right' size='lg'>
				<DrawerHeader>
					<DrawerTitle>{t('queue.test.title')}</DrawerTitle>
				</DrawerHeader>
				<APIServerAlert />
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='p-6 flex-1 flex flex-col'>
						<div className='flex items-center justify-between'>
							<span className='text-sm font-semibold text-default'>{queue.name}</span>
							<Button variant='primary' type='submit' loading={isPending}>
								{t('queue.test.submit')}
							</Button>
						</div>
						<Separator className='my-6' />
						<div className='flex-1'>
							<PanelGroup direction='vertical' autoSaveId={queue._id}>
								<Panel defaultSize={32} className='max-h-full !overflow-y-auto' minSize={20}>
									<FormField
										control={form.control}
										name='payload'
										render={({ field }) => (
											<FormItem className='h-full'>
												<FormControl className='h-full'>
													<CodeEditor
														className='min-h-[100px] h-full'
														containerClassName='h-full'
														value={stringifyIfObject(field.value)}
														onChange={field.onChange}
														name={`testQueuePayload-${queue._id}`}
														defaultLanguage='json'
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</Panel>
								<Resizer className='my-6' orientation='horizontal' />
								<Panel minSize={30}>
									<Logs logs={testQueueLogs?.[queue?._id]?.logs as Log[]} />
								</Panel>
							</PanelGroup>
						</div>
					</form>
				</Form>
			</DrawerContent>
		</Drawer>
	);
}
