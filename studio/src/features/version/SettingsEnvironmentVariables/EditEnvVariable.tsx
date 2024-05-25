import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Form } from '@/components/Form';
import useSettingsStore from '@/store/version/settingsStore';
import { APIError, EnvVariableSchema } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import EnvVariableForm from './EnvVariableForm';
import { useToast } from '@/hooks';
interface EditEnvVariableProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export default function EditEnvVariable({ open, onOpenChange }: EditEnvVariableProps) {
	const form = useForm<z.infer<typeof EnvVariableSchema>>({
		resolver: zodResolver(EnvVariableSchema),
	});
	const { toast } = useToast();
	const { param, updateParam } = useSettingsStore();
	const { orgId, appId, versionId } = useParams() as Record<string, string>;
	const { mutateAsync: updateParamMutate, isPending } = useMutation({
		mutationKey: ['updateParam'],
		mutationFn: updateParam,
		onSuccess: () => {
			onClose();
			toast({
				title: t('version.variable.update_success') as string,
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

	function onSubmit(data: z.infer<typeof EnvVariableSchema>) {
		updateParamMutate({ orgId, appId, versionId, paramId: param._id, ...data });
	}
	useEffect(() => {
		if (!open) form.reset();
		else if (param) {
			form.reset(param);
		}
	}, [open, param]);

	function onClose() {
		form.reset();
		onOpenChange(false);
	}
	return (
		<Drawer open={open} onOpenChange={onClose}>
			<DrawerContent position='right'>
				<DrawerHeader>
					<DrawerTitle>{t('version.variable.edit')}</DrawerTitle>
				</DrawerHeader>
				<Form {...form}>
					<form className='p-6 flex flex-col gap-6' onSubmit={form.handleSubmit(onSubmit)}>
						<EnvVariableForm loading={isPending} />
					</form>
				</Form>
			</DrawerContent>
		</Drawer>
	);
}
