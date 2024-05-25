import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Form } from '@/components/Form';
import { useToast } from '@/hooks';
import useSettingsStore from '@/store/version/settingsStore';
import { CustomDomainSchema } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { CustomDomainForm } from '.';
interface AddVersionDomainProps {
	open: boolean;
	onClose: () => void;
}

export default function AddVersionDomain({ open, onClose }: AddVersionDomainProps) {
	const { t } = useTranslation();
	const { toast } = useToast();
	const { addCustomDomain } = useSettingsStore();
	const form = useForm<z.infer<typeof CustomDomainSchema>>({
		resolver: zodResolver(CustomDomainSchema),
	});
	const { versionId, appId, orgId } = useParams() as Record<string, string>;
	const { mutate: createDomainMutation, isPending } = useMutation({
		mutationFn: addCustomDomain,
		onSuccess: handleClose,
		onError: (error) => {
			toast({
				title: error.details,
				action: 'error',
			});
		},
	});

	function onSubmit(data: z.infer<typeof CustomDomainSchema>) {
		createDomainMutation({
			...data,
			orgId,
			appId,
			versionId,
		});
	}

	function handleClose() {
		form.reset();
		onClose();
	}
	return (
		<Drawer open={open} onOpenChange={handleClose}>
			<DrawerContent position='right' size='lg' className='h-full'>
				<DrawerHeader>
					<DrawerTitle>{t('cluster.add_domain')}</DrawerTitle>
				</DrawerHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='p-6 scroll'>
						<CustomDomainForm loading={isPending} modal />
					</form>
				</Form>
			</DrawerContent>
		</Drawer>
	);
}
