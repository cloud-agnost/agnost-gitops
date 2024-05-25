import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Form } from '@/components/Form';
import { useToast } from '@/hooks';
import useDatabaseStore from '@/store/database/databaseStore';
import { APIError, UpdateDatabaseSchema } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import DatabaseForm from './DatabaseForm';
import { useEffect } from 'react';
export default function EditDatabase() {
	const form = useForm<z.infer<typeof UpdateDatabaseSchema>>({
		resolver: zodResolver(UpdateDatabaseSchema),
	});
	const { toast } = useToast();
	const { updateDatabase, database, isEditDatabaseDialogOpen, closeEditDatabaseModal } =
		useDatabaseStore();
	const { isPending, mutateAsync: updateDatabaseMutation } = useMutation({
		mutationFn: updateDatabase,
		onSuccess: () => {
			toast({
				title: t('database.edit.success') as string,
				action: 'success',
			});
			closeEditDatabaseModal();
			form.reset();
		},
		onError: (error: APIError) => {
			toast({
				title: error.details,
				action: 'error',
			});
		},
	});

	const { versionId, appId, orgId } = useParams() as {
		versionId: string;
		appId: string;
		orgId: string;
	};

	async function onSubmit(data: z.infer<typeof UpdateDatabaseSchema>) {
		updateDatabaseMutation({
			orgId,
			versionId,
			appId,
			dbId: database?._id,
			...data,
		});
	}

	useEffect(() => {
		if (database) {
			form.reset(database);
		}
	}, [database]);

	return (
		<Drawer open={isEditDatabaseDialogOpen} onOpenChange={closeEditDatabaseModal}>
			<DrawerContent className='overflow-x-hidden'>
				<DrawerHeader className='relative'>
					<DrawerTitle>{t('database.edit.title')}</DrawerTitle>
				</DrawerHeader>

				<Form {...form}>
					<form className='p-6 space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
						<DatabaseForm edit loading={isPending} disabled={database?.assignUniqueName} />
					</form>
				</Form>
			</DrawerContent>
		</Drawer>
	);
}
