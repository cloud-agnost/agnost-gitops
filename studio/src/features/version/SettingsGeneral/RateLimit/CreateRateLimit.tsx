import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Form } from '@/components/Form';
import { useToast } from '@/hooks';
import useSettingsStore from '@/store/version/settingsStore';
import useVersionStore from '@/store/version/versionStore';
import { APIError, CreateRateLimitSchema, RateLimit } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import * as z from 'zod';
import RateLimitForm from './RateLimitForm';

interface CreateRateLimitProps {
	open: boolean;
	type?: 'realtime' | 'endpoint';
	onOpenChange: (open: boolean) => void;
	onCreate?: (limiter: RateLimit) => void;
}
export default function CreateRateLimit({
	open,
	type,
	onOpenChange,
	onCreate,
}: CreateRateLimitProps) {
	const { toast } = useToast();
	const { t } = useTranslation();
	const form = useForm<z.infer<typeof CreateRateLimitSchema>>({
		resolver: zodResolver(CreateRateLimitSchema),
		defaultValues: {
			errorMessage: t('version.add.rate_limiter.error_message.default').toString(),
		},
	});
	const { createRateLimit, updateVersionRealtimeProperties } = useSettingsStore();
	const { updateVersionProperties } = useVersionStore();
	const realtime = useVersionStore((state) => state.version?.realtime);
	const defaultEndpointLimits = useVersionStore((state) => state.version?.defaultEndpointLimits);
	const realtimeEndpoints = useVersionStore((state) => state.version?.realtime?.rateLimits);
	const { orgId, versionId, appId } = useParams<{
		versionId: string;
		appId: string;
		orgId: string;
	}>();
	const { mutateAsync: createRateLimitMutate, isPending } = useMutation({
		mutationFn: createRateLimit,
		onSuccess: onSuccess,
		onError: (error: APIError) => {
			toast({
				action: 'error',
				title: error.details,
			});
		},
	});
	async function handleCreateRateLimit(data: z.infer<typeof CreateRateLimitSchema>) {
		await createRateLimitMutate({
			orgId,
			versionId,
			appId,
			...data,
		});
	}
	function onSubmit(values: z.infer<typeof CreateRateLimitSchema>) {
		if (!versionId || !appId || !orgId) return;
		handleCreateRateLimit(values);
	}

	function onSuccess(rateLimit: RateLimit) {
		if (!versionId || !appId || !orgId) return;
		if (type === 'endpoint') {
			updateVersionProperties({
				orgId,
				versionId,
				appId,
				defaultEndpointLimits: [...(defaultEndpointLimits ?? []), rateLimit.iid],
				onError: (error) => {
					toast({
						action: 'error',

						title: error.details,
					});
				},
			});
		}
		if (type === 'realtime') {
			updateVersionRealtimeProperties({
				orgId,
				versionId,
				appId,
				...realtime,
				rateLimits: [...(realtimeEndpoints ?? []), rateLimit.iid],
			});
		}
		if (!type) {
			onCreate?.(rateLimit);
		}
		onClose();
	}

	function onClose() {
		form.reset();
		onOpenChange(false);
	}
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
