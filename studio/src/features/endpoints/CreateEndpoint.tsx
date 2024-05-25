import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Form } from '@/components/Form';
import { useTabNavigate, useToast } from '@/hooks';
import useEndpointStore from '@/store/endpoint/endpointStore';
import useVersionStore from '@/store/version/versionStore';
import { APIError, CreateEndpointSchema, TabTypes } from '@/types';
import { removeEmptyFields, translate as t } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import * as z from 'zod';
import EndpointForm from './EndpointForm';
import { useEffect } from 'react';

export default function CreateEndpoint() {
	const { createEndpoint, isCreateEndpointDialogOpen, toggleCreateModal } = useEndpointStore();

	const { getVersionDashboardPath } = useVersionStore();
	const navigate = useTabNavigate();
	const { versionId, appId, orgId } = useParams<{
		versionId: string;
		appId: string;
		orgId: string;
	}>();
	const { toast } = useToast();
	const form = useForm<z.infer<typeof CreateEndpointSchema>>({
		resolver: zodResolver(CreateEndpointSchema),
		defaultValues: {
			method: 'GET',
			logExecution: false,
		},
	});

	const { mutateAsync: createEndpointMutation, isPending } = useMutation({
		mutationFn: createEndpoint,
		mutationKey: ['create-endpoint'],
		onSuccess: (endpoint) => {
			navigate({
				title: endpoint.name,
				path: getVersionDashboardPath(`endpoint/${endpoint._id}`),
				isActive: true,
				isDashboard: false,
				type: TabTypes.Endpoint,
			});
			closeDrawer();
		},
		onError: ({ details }: APIError) => {
			toast({
				title: details,
				action: 'error',
			});
		},
	});

	async function onSubmit(data: z.infer<typeof CreateEndpointSchema>) {
		const params = removeEmptyFields(data) as z.infer<typeof CreateEndpointSchema>;
		await createEndpointMutation({
			orgId: orgId as string,
			appId: appId as string,
			versionId: versionId as string,
			...params,
		});
	}

	function closeDrawer() {
		toggleCreateModal();
		form.reset();
	}

	useEffect(() => {
		if (isCreateEndpointDialogOpen) {
			form.reset();
		}
	}, [isCreateEndpointDialogOpen]);

	return (
		<Drawer open={isCreateEndpointDialogOpen} onOpenChange={closeDrawer}>
			<DrawerContent position='right' size='lg' className='h-full'>
				<DrawerHeader>
					<DrawerTitle>{t('endpoint.create.title')}</DrawerTitle>
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
