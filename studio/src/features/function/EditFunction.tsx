import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Form } from '@/components/Form';
import { useToast } from '@/hooks';
import useFunctionStore from '@/store/function/functionStore';
import { APIError, CreateFunctionSchema } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import * as z from 'zod';
import FunctionForm from './FunctionForm';
import { useMutation } from '@tanstack/react-query';
export default function EditTask() {
	const { t } = useTranslation();
	const {
		updateFunction,
		toEditFunction: helper,
		isEditFunctionDrawerOpen,
		closeEditFunctionModal,
	} = useFunctionStore();
	const { toast } = useToast();
	const { versionId, appId, orgId } = useParams<{
		versionId: string;
		appId: string;
		orgId: string;
	}>();

	const form = useForm<z.infer<typeof CreateFunctionSchema>>({
		resolver: zodResolver(CreateFunctionSchema),
	});

	const { mutate: updateFunctionMutation, isPending } = useMutation({
		mutationFn: updateFunction,
		onSuccess: () => {
			closeEditFunctionModal();
			toast({
				title: t('function.edit_success') as string,
				action: 'success',
			});
		},
		onError: (error: APIError) => {
			toast({
				title: error.details,
				action: 'error',
			});
		},
	});

	function onSubmit(data: z.infer<typeof CreateFunctionSchema>) {
		updateFunctionMutation({
			orgId: orgId as string,
			appId: appId as string,
			versionId: versionId as string,
			funcId: helper._id,
			...data,
		});
	}

	useEffect(() => {
		if (helper) {
			form.reset(helper);
		}
	}, [helper]);
	return (
		<Drawer open={isEditFunctionDrawerOpen} onOpenChange={closeEditFunctionModal}>
			<DrawerContent position='right' size='lg' className='h-full'>
				<DrawerHeader>
					<DrawerTitle>
						{t('function.edit', {
							name: helper.name,
						})}
					</DrawerTitle>
				</DrawerHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='p-6 scroll'>
						<FunctionForm loading={isPending} />
					</form>
				</Form>
			</DrawerContent>
		</Drawer>
	);
}
