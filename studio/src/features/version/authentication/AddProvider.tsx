import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Form } from '@/components/Form';
import { useToast } from '@/hooks';
import useSettingsStore from '@/store/version/settingsStore';
import { APIError, OAuthProvider } from '@/types';
import { capitalize, translate as t } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import * as z from 'zod';
import ProviderFrom, { AddOAuthProviderSchema } from './ProviderFrom';

interface AddProviderProps {
	open: boolean;
	onClose: () => void;
	provider: OAuthProvider;
}

export default function AddProvider({ open, onClose, provider }: AddProviderProps) {
	const { toast } = useToast();
	const { createOAuthConfig } = useSettingsStore();
	const { orgId, appId, versionId } = useParams() as Record<string, string>;
	const form = useForm<z.infer<typeof AddOAuthProviderSchema>>({
		resolver: zodResolver(AddOAuthProviderSchema),
		defaultValues: {
			provider: provider?.provider,
		},
	});
	const { mutateAsync: createOAuthConfigMutate, isPending } = useMutation({
		mutationKey: ['createOAuthConfig'],
		mutationFn: createOAuthConfig,
		onSuccess: () => handleCloseModel(),
		onError: (error: APIError) => {
			toast({
				action: 'error',
				title: error.details,
			});
		},
	});

	function onSubmit(data: z.infer<typeof AddOAuthProviderSchema>) {
		createOAuthConfigMutate({
			orgId,
			versionId,
			appId,
			...data,
		});
	}

	function handleCloseModel() {
		form.reset();
		onClose();
	}

	useEffect(() => {
		if (open && provider) {
			form.setValue('provider', provider.provider);
		}
	}, [provider]);

	return (
		<Drawer open={open} onOpenChange={handleCloseModel}>
			<DrawerContent position='right' size='lg'>
				<DrawerHeader>
					<DrawerTitle>
						{t('version.authentication.add_provider_title', {
							provider: capitalize(provider?.provider),
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
