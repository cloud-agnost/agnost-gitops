import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Form } from '@/components/Form';
import useSettingsStore from '@/store/version/settingsStore';
import { CreateRateLimitSchema } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import * as z from 'zod';
import RateLimitForm from './RateLimitForm';
import { toast } from '@/hooks/useToast';

interface EditRateLimitProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export default function EditRateLimit({ open, onOpenChange }: EditRateLimitProps) {
	const { t } = useTranslation();
	const { editRateLimit, rateLimit } = useSettingsStore();
	const form = useForm<z.infer<typeof CreateRateLimitSchema>>({
		resolver: zodResolver(CreateRateLimitSchema),
		defaultValues: {
			errorMessage: t('version.add.rate_limiter.error_message.default').toString(),
		},
	});

	const { mutateAsync: editRateLimitMutate, isPending } = useMutation({
		mutationFn: editRateLimit,
		onSuccess: () => {
			onClose();
			toast({
				action: 'success',
				title: t('version.edit_rate_limiter_success').toString(),
			});
		},
	});

	const { orgId, versionId, appId } = useParams<{
		versionId: string;
		appId: string;
		orgId: string;
	}>();

	function onSubmit(data: z.infer<typeof CreateRateLimitSchema>) {
		if (!rateLimit || !orgId || !versionId || !appId) return;
		editRateLimitMutate({
			orgId,
			versionId,
			appId,
			limitId: rateLimit?._id,
			...data,
		});
	}

	function onClose() {
		form.reset();
		onOpenChange(false);
	}

	useEffect(() => {
		if (!open) form.reset();

		if (rateLimit) {
			form.reset(rateLimit);
		}
	}, [open, rateLimit]);

	return (
		<Drawer open={open} onOpenChange={onClose}>
			<DrawerContent position='right'>
				<DrawerHeader>
					<DrawerTitle>{t('version.add_rate_limiter')}</DrawerTitle>
				</DrawerHeader>
				<div className='p-6'>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)}>
							<RateLimitForm loading={isPending} onSubmit={onSubmit} />
						</form>
					</Form>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
