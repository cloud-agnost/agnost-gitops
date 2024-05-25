import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Form } from '@/components/Form';
import { useTabNavigate, useToast } from '@/hooks';
import useDatabaseStore from '@/store/database/databaseStore';
import useResourceStore from '@/store/resources/resourceStore';
import useVersionStore from '@/store/version/versionStore';
import { APIError, CreateDatabaseSchema, TabTypes } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import DatabaseForm from './DatabaseForm';
export default function CreateDatabase() {
	const navigate = useTabNavigate();
	const form = useForm<z.infer<typeof CreateDatabaseSchema>>({
		resolver: zodResolver(CreateDatabaseSchema),
		defaultValues: {
			assignUniqueName: true,
			poolSize: 1,
		},
	});
	const { toast } = useToast();
	const { versionId, appId, orgId } = useParams() as {
		versionId: string;
		appId: string;
		orgId: string;
	};
	const { createDatabase, isCreateDatabaseDialogOpen, toggleCreateModal } = useDatabaseStore();
	const { getVersionDashboardPath } = useVersionStore();
	const resources = useResourceStore((state) =>
		state.resources.filter((resource) => resource.type === 'database'),
	);
	const { mutateAsync: createDatabaseMutation, isPending } = useMutation({
		mutationFn: createDatabase,
		onSuccess: (database) => {
			toggleCreateModal();
			form.reset();

			navigate({
				title: database.name,
				path: getVersionDashboardPath(`database/${database._id}/models`),
				isActive: true,
				isDashboard: false,
				type: TabTypes.Model,
			});
		},
		onError: (error: APIError) => {
			toast({
				title: error.details,
				action: 'error',
			});
		},
	});

	function onCloseHandler() {
		toggleCreateModal();
		form.reset();
	}

	useEffect(() => {
		if (isCreateDatabaseDialogOpen) {
			form.reset();
		}
	}, [isCreateDatabaseDialogOpen]);

	async function onSubmit(data: z.infer<typeof CreateDatabaseSchema>) {
		const resource = resources.find((item) => item._id === data.resourceId);
		if (!versionId || !resource) return;
		createDatabaseMutation({
			orgId,
			versionId,
			appId,
			type: resource.instance,
			...data,
		});
	}
	return (
		<Drawer open={isCreateDatabaseDialogOpen} onOpenChange={onCloseHandler}>
			<DrawerContent className='overflow-x-hidden'>
				<DrawerHeader className='relative'>
					<DrawerTitle>{t('database.add.title')}</DrawerTitle>
				</DrawerHeader>
				<Form {...form}>
					<form className='p-6 space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
						<DatabaseForm loading={isPending} />
					</form>
				</Form>
			</DrawerContent>
		</Drawer>
	);
}
