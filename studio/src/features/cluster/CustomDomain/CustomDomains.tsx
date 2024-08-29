import { Alert, AlertDescription } from '@/components/Alert';
import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { useToast } from '@/hooks';
import useAuthStore from '@/store/auth/authStore';
import useClusterStore from '@/store/cluster/clusterStore';
import { APIError, CustomDomainSchema } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import CustomDomainForm from './CustomDomainForm';
import DnsSettings from './DnsSettings';
import DomainList from './DomainList';
import { Badge } from '@/components/Badge';
import { BADGE_COLOR_MAP } from '@/constants';
import { isRootDomain } from '@/utils';

export default function CustomDomains() {
	const { t } = useTranslation();
	const form = useForm<z.infer<typeof CustomDomainSchema>>({
		resolver: zodResolver(CustomDomainSchema),
	});
	const { toast } = useToast();
	const user = useAuthStore((state) => state.user);
	const { addDomain, clusterDomainError, cluster } = useClusterStore();

	const { mutate: addDomainMutation, isPending } = useMutation({
		mutationFn: addDomain,
		onSuccess: () => {
			form.reset({
				domain: '',
			});
			toast({
				action: 'success',
				title: t('cluster.domain_added') as string,
			});
		},
		onError: (error: APIError) => {
			toast({
				action: 'error',
				title: error.details,
			});
		},
	});

	async function onSubmit(data: z.infer<typeof CustomDomainSchema>) {
		addDomainMutation({
			domain: data.domain,
		});
	}

	return (
		<div className='space-y-6 max-w-2xl'>
			{clusterDomainError ? (
				<Alert variant='warning'>
					<AlertDescription className='text-slate-300'>
						{t('cluster.domain_error')}
					</AlertDescription>
				</Alert>
			) : (
				<>
					<div className='space-y-4'>
						<DomainList />
						{!cluster?.domains.length && (
							<Form {...form}>
								<form
									className='flex items-start justify-center gap-2'
									onSubmit={form.handleSubmit(onSubmit)}
								>
									<CustomDomainForm />
									<div className='flex justify-top'>
										<Button
											type='submit'
											variant='primary'
											loading={isPending}
											disabled={!user?.isClusterOwner}
										>
											{t('cluster.add_domain')}
										</Button>
									</div>
								</form>
							</Form>
						)}

						{cluster.certificateStatus && (
							<div className='flex items-center justify-between'>
								<p className='text-sm'>Certificate Status</p>
								<Badge
									variant={BADGE_COLOR_MAP[cluster?.certificateStatus?.toUpperCase() ?? '']}
									className='text-xs'
									text={cluster?.certificateStatus}
									loading={cluster?.certificateStatus === 'Issuing'}
									icon
								/>
							</div>
						)}
					</div>
					<DnsSettings
						description={t('cluster.dns_settings_description')}
						ips={cluster.ips}
						slug={cluster?.slug ?? ''}
						isRootDomain={isRootDomain(cluster.domains[0])}
					/>
				</>
			)}
		</div>
	);
}
