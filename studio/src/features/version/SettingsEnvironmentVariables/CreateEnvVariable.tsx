import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { APIError, EnvVariableSchema } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import EnvVariableForm from './EnvVariableForm';
import { useParams } from 'react-router-dom';
import useSettingsStore from '@/store/version/settingsStore';
import { useMutation } from '@tanstack/react-query';
import { Form } from '@/components/Form';
import { useToast } from '@/hooks';
interface CreateEnvVariableProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export default function CreateEnvVariable({ open, onOpenChange }: CreateEnvVariableProps) {
	const { t } = useTranslation();
	const { toast } = useToast();
	const form = useForm<z.infer<typeof EnvVariableSchema>>({
		resolver: zodResolver(EnvVariableSchema),
	});
	const { orgId, appId, versionId } = useParams() as Record<string, string>;
	const { addParam } = useSettingsStore();
	const { mutateAsync: addParamMutate, isPending } = useMutation({
		mutationKey: ['addParam'],
		mutationFn: addParam,
		onSuccess: onClose,
		onError: (error: APIError) => {
			toast({
				title: error.details,
				action: 'error',
			});
		},
	});

	function onSubmit(data: z.infer<typeof EnvVariableSchema>) {
		addParamMutate({ orgId, appId, versionId, ...data });
	}

	function onClose() {
		onOpenChange(false);
		form.reset();
	}

	return (
		<Drawer open={open} onOpenChange={onClose}>
			<DrawerContent position='right'>
				<DrawerHeader>
					<DrawerTitle>{t('version.variable.add')}</DrawerTitle>
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
