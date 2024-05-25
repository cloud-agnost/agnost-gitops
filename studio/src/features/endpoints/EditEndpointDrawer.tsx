import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import useEndpointStore from '@/store/endpoint/endpointStore';
import { APIError, CreateEndpointSchema } from '@/types';
import { translate as t, removeEmptyFields } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import EndpointForm from './EndpointForm';
import { Form } from '@/components/Form';
import { useToast } from '@/hooks';
import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import useMiddlewareStore from '@/store/middleware/middlewareStore';

export default function EditEndpointDrawer() {
	const { toEditEndpoint, updateEndpoint, isEditEndpointModalOpen, closeEditEndpointModal } =
		useEndpointStore();
	const { getMiddlewares, workspaceMiddlewares } = useMiddlewareStore();
	const { toast } = useToast();
	const { versionId, appId, orgId } = useParams<{
		versionId: string;
		appId: string;
		orgId: string;
	}>();
	const form = useForm<z.infer<typeof CreateEndpointSchema>>({
		resolver: zodResolver(CreateEndpointSchema),
	});
	const { mutateAsync: updateEndpointMutation, isPending } = useMutation({
		mutationFn: updateEndpoint,
		onSuccess: () => {
			closeEditEndpointModal();
			form.reset();
			toast({
				title: t('endpoint.editSuccess'),
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
	function onSubmit(data: z.infer<typeof CreateEndpointSchema>) {
		const params = removeEmptyFields(data) as z.infer<typeof CreateEndpointSchema>;
		updateEndpointMutation({
			orgId: orgId as string,
			appId: appId as string,
			versionId: versionId as string,
			epId: toEditEndpoint?._id as string,
			...params,
		});
	}

	useEffect(() => {
		if (toEditEndpoint && isEditEndpointModalOpen) {
			form.reset({
				name: toEditEndpoint.name,
				method: toEditEndpoint.method,
				path: toEditEndpoint.path,
				sessionRequired: toEditEndpoint.sessionRequired,
				apiKeyRequired: toEditEndpoint.apiKeyRequired,
				timeout: toEditEndpoint.timeout,
				logExecution: toEditEndpoint.logExecution,
				rateLimits: toEditEndpoint.rateLimits,
				middlewares: toEditEndpoint?.middlewares,
			});
		}
	}, [toEditEndpoint, isEditEndpointModalOpen]);
	useQuery({
		queryFn: () =>
			getMiddlewares({
				orgId: orgId as string,
				appId: appId as string,
				versionId: versionId as string,
				page: 0,
				size: 250,
				workspace: true,
			}),
		queryKey: ['getMiddlewares'],
		enabled: !workspaceMiddlewares.length,
	});

	return (
		<Drawer open={isEditEndpointModalOpen} onOpenChange={closeEditEndpointModal}>
			<DrawerContent position='right' size='lg' className='h-full'>
				<DrawerHeader>
					<DrawerTitle>
						{t('endpoint.edit', {
							name: toEditEndpoint?.name,
						})}
					</DrawerTitle>
				</DrawerHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='p-6 scroll'>
						<EndpointForm loading={isPending} />
					</form>
				</Form>
			</DrawerContent>
		</Drawer>
	);
}
