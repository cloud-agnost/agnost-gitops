import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Form } from '@/components/Form';
import useSettingsStore from '@/store/version/settingsStore';
import { APIError, VersionOAuthProvider } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { capitalize } from 'lodash';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import ProviderFrom, { AddOAuthProviderSchema } from './ProviderFrom';
import { toast } from '@/hooks/useToast';

interface EditProviderProps {
	open: boolean;
	onClose: () => void;
	editedProvider?: VersionOAuthProvider;
}

export default function EditProvider({ open, onClose, editedProvider }: EditProviderProps) {
	const { updateOAuthConfig } = useSettingsStore();
	const { orgId, appId, versionId } = useParams() as Record<string, string>;
	const form = useForm<z.infer<typeof AddOAuthProviderSchema>>({
		resolver: zodResolver(AddOAuthProviderSchema),
		defaultValues: {
			provider: editedProvider?.provider,
			config: editedProvider?.config,
		},
	});
	const { mutateAsync: updateOAuthConfigMutate, isPending } = useMutation({
		mutationKey: ['updateOAuthConfig'],
		mutationFn: updateOAuthConfig,
		onSuccess: () => handleCloseModel(),
		onError: (error: APIError) => {
			toast({
				action: 'error',
				title: error.details,
			});
		},
	});

	function handleCloseModel() {
		onClose();
		form.reset();
	}
	function onSubmit(data: z.infer<typeof AddOAuthProviderSchema>) {
		updateOAuthConfigMutate({
			orgId,
			versionId,
			appId,
			providerId: editedProvider?._id as string,
			...data.config,
		});
	}

	useEffect(() => {
		if (editedProvider) {
			form.reset(editedProvider);
		}
	}, [editedProvider]);
	return (
		<Drawer open={open} onOpenChange={handleCloseModel}>
			<DrawerContent position='right' size='lg'>
				<DrawerHeader>
					<DrawerTitle>
						{t('version.authentication.edit_provider_title', {
							provider: capitalize(editedProvider?.provider),
						})}
					</DrawerTitle>
				</DrawerHeader>
				<div className='p-6'>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
							<ProviderFrom loading={isPending} />
						</form>
					</Form>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
