import { buttonVariants } from '@/components/Button';
import { Bitbucket, Github } from '@/components/icons';
import GitLab from '@/components/icons/GitLab';
import { Separator } from '@/components/Separator';
import { TableConfirmation } from '@/components/Table';
import { useToast } from '@/hooks';
import useContainerStore from '@/store/container/containerStore';
import { cn } from '@/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
export default function UserProviders() {
	const { addGitProvider, disconnectGitProvider, getGitProviders } = useContainerStore();
	const { t } = useTranslation();
	const { toast } = useToast();
	const qc = useQueryClient();
	const [searchParams, setSearchParams] = useSearchParams();
	function getProviderIcon(provider: 'github' | 'gitlab' | 'bitbucket', className?: string) {
		switch (provider) {
			case 'github':
				return <Github className={cn('size-4 mr-1', className)} />;
			case 'gitlab':
				return <GitLab className={cn('size-4 mr-1', className)} />;
			case 'bitbucket':
				return <Bitbucket className={cn('size-4 mr-1', className)} />;
			default:
				return null;
		}
	}

	const { data: providers } = useQuery({
		queryKey: ['userProviders'],
		queryFn: getGitProviders,
	});

	const { mutateAsync: disconnect } = useMutation({
		mutationFn: disconnectGitProvider,
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: ['userProviders'],
			});
		},
		onError: (error) => {
			document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
			toast({
				action: 'error',
				title: error.details,
			});
		},
	});

	const { mutate: addProvider } = useMutation({
		mutationFn: () =>
			addGitProvider({
				accessToken: searchParams.get('access_token') as string,
				provider: searchParams.get('provider') as 'github' | 'gitlab' | 'bitbucket',
				expiresAt: searchParams.get('expires_at') as string,
				refreshToken: searchParams.get('refresh_token') as string,
			}),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: ['userProviders'],
			});
		},
		onError: ({ details }) => {
			toast({ action: 'error', title: details });
		},
		onSettled: () => setSearchParams({}),
	});

	useEffect(() => {
		if (searchParams.has('access_token')) {
			addProvider();
		}
	}, [searchParams.get('access_token')]);
	return (
		<div className='space-y-2'>
			{providers?.map((provider) => (
				<div
					className='flex items-center justify-between bg-wrapper-background-base p-3 rounded group'
					key={provider._id}
				>
					<div className='flex items-center gap-4'>
						{getProviderIcon(provider.provider)}
						<p className='text-sm'>{provider.username}</p>
					</div>

					<TableConfirmation
						align='end'
						title='Disconnect Provider'
						description={`Are you sure you want to disconnect ${provider.provider} provider?`}
						onConfirm={() => disconnect(provider._id)}
						contentClassName='m-0'
						hasPermission={true}
					/>
				</div>
			))}
			<Separator />
			<div className='flex items-center gap-1'>
				{['github', 'gitlab', 'bitbucket'].map((provider) => (
					<Link
						key={provider}
						to={`https://api.agnost.dev/oauth/${provider}?redirect=${window.location.href}?provider=${provider}`}
						className={buttonVariants({
							variant: 'outline',
							size: 'full',
						})}
					>
						{getProviderIcon(provider as 'github' | 'gitlab' | 'bitbucket')}
						{t('container.source.connect_git', {
							provider: _.startCase(provider),
						})}
					</Link>
				))}
			</div>
		</div>
	);
}
