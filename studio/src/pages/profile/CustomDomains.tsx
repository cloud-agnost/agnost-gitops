import { Feedback } from '@/components/Alert';
import { Button } from '@/components/Button';
import { Description } from '@/components/Description';
import { Form } from '@/components/Form';
import {
	CustomDomainForm,
	DnsSettings,
	DomainList,
	EnforceSSL,
} from '@/features/version/CustomDomain';
import { useToast } from '@/hooks';
import useAuthStore from '@/store/auth/authStore';
import useClusterStore from '@/store/cluster/clusterStore';
import { APIError, CustomDomainSchema } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import _ from 'lodash';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';

export default function CustomDomains() {
	const { t } = useTranslation();
	const form = useForm<z.infer<typeof CustomDomainSchema>>({
		resolver: zodResolver(CustomDomainSchema),
	});
	const { toast } = useToast();
	const user = useAuthStore((state) => state.user);
	const { addDomain, clusterDomainError } = useClusterStore();

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

	return _.isNil(clusterDomainError) ? (
		<div className='space-y-6 max-w-2xl'>
			<p className='text-subtle text-sm'>{t('cluster.custom_domain_description')}</p>
			<EnforceSSL />
			<DnsSettings />
			<div className='space-y-4'>
				<Description title={t('cluster.domains')} />
				<DomainList />
				<Form {...form}>
					<form className='space-y-4' onSubmit={form.handleSubmit(onSubmit)}>
						<CustomDomainForm />
						<div className='flex justify-end'>
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
			</div>
		</div>
	) : (
		<div className='h-full flex flex-col items-center justify-center'>
			<Feedback
				title={clusterDomainError?.error}
				description={clusterDomainError?.details}
				className='max-w-2xl'
			/>
		</div>
	);
}
