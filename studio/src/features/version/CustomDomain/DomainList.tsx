import { TableConfirmation } from '@/components/Table';
import { useToast } from '@/hooks';
import useAuthStore from '@/store/auth/authStore';
import useClusterStore from '@/store/cluster/clusterStore';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
export default function DomainList() {
	const { toast } = useToast();
	const { t } = useTranslation();
	const { cluster, deleteDomain } = useClusterStore();
	const user = useAuthStore((state) => state.user);
	const { mutate: deleteDomainMutate } = useMutation({
		mutationFn: deleteDomain,
		onSuccess: () => {
			toast({
				action: 'success',
				title: t('cluster.delete_domain_success') as string,
			});
		},
		onError: (error) => {
			toast({
				action: 'error',
				title: error.details,
			});
		},
	});
	return cluster.domains.map((domain) => (
		<div
			className='flex items-center justify-between space-x-2 bg-wrapper-background-base p-3 rounded group'
			key={domain}
		>
			<p className='text-default font-sfCompact'>{domain}</p>
			<TableConfirmation
				align='end'
				title={t('cluster.domain.delete')}
				description={t('cluster.domain.delete_description')}
				onConfirm={() =>
					deleteDomainMutate({
						domain,
					})
				}
				contentClassName='m-0'
				hasPermission={user?.isClusterOwner as boolean}
			/>
		</div>
	));
}
