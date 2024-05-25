import { Alert, AlertTitle } from '@/components/Alert';
import { Button } from '@/components/Button';
import { DataTable } from '@/components/DataTable';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuItemContainer,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/Dropdown';
import { Separator } from '@/components/Separator';
import { CLUSTER_RELEASE_CLASS_MAP } from '@/constants';
import { useTable, useToast } from '@/hooks';
import useAuthStore from '@/store/auth/authStore';
import useClusterStore from '@/store/cluster/clusterStore';
import { APIError } from '@/types';
import { cn } from '@/utils';
import {
	ArrowCounterClockwise,
	ClockCounterClockwise,
	FileText,
	Package,
} from '@phosphor-icons/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import ReleaseColumns from './ReleaseColumns';
import { Loading } from '@/components/Loading';

export default function ReleaseDropdown() {
	const [open, setOpen] = useState(false);
	const { t } = useTranslation();
	const { getClusterAndReleaseInfo, clusterReleaseInfo } = useClusterStore();
	const classes = CLUSTER_RELEASE_CLASS_MAP[getReleaseStatus()];
	const hasUpdate = clusterReleaseInfo?.latest?.release !== clusterReleaseInfo?.current?.release;
	const { isFetching, refetch } = useQuery({
		queryFn: getClusterAndReleaseInfo,
		queryKey: ['getClusterAndReleaseInfo'],
		refetchOnWindowFocus: false,
		refetchInterval: 15 * 60 * 1000,
	});

	function getReleaseStatus(): string {
		if (clusterReleaseInfo?.cluster?.clusterResourceStatus.some((item) => item.status === 'Error'))
			return 'Error';
		if (
			clusterReleaseInfo?.cluster?.clusterResourceStatus.some((item) => item.status === 'Updating')
		)
			return 'Updating';

		if (clusterReleaseInfo?.latest?.release !== clusterReleaseInfo?.current?.release)
			return 'Has update';
		return 'OK';
	}

	useEffect(() => {
		if (open) {
			refetch();
		}
	}, [open]);

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Button variant='icon' size='sm' rounded className='relative'>
					{getReleaseStatus() !== 'OK' && (
						<div className='absolute top-1.5 right-1'>
							<div className='relative flex items-center justify-center h-2.5 w-2.5'>
								<span
									className={cn(
										'ping absolute inline-flex h-full w-full rounded-full ',
										classes?.[0],
									)}
								/>
								<span className={cn('relative inline-flex rounded-full h-2 w-2', classes?.[1])} />
							</div>
						</div>
					)}
					<Package size={18} />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className='relative w-[21rem] h-full' align='end'>
				<DropdownMenuLabel className='text-default flex items-center justify-between px-4 py-2'>
					<p>{t('cluster.release_info')}</p>
					<span className='text-subtle text-sm font-sfCompact inline-block text-right'>
						{clusterReleaseInfo?.current?.release}
					</span>
				</DropdownMenuLabel>
				<DropdownMenuSeparator className='my-0' />
				<DropdownMenuLabel className='p-0'>
					<Alert variant={hasUpdate ? 'warning' : 'success'} size='sm'>
						<AlertTitle className='font-normal'>
							{hasUpdate ? t('cluster.update_available') : t('cluster.up_to_date')}
						</AlertTitle>
					</Alert>
				</DropdownMenuLabel>

				<ReleaseInfo loading={isFetching} />
				<Separator />
				<ReleaseSettings />
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function ReleaseInfo({ loading = false }: { loading: boolean }) {
	const { clusterComponentsReleaseInfo } = useClusterStore();

	const table = useTable({
		columns: ReleaseColumns,
		data: clusterComponentsReleaseInfo,
	});

	return loading && _.isEmpty(clusterComponentsReleaseInfo) ? (
		<div className='h-96 relative'>
			<Loading loading={loading && _.isEmpty(clusterComponentsReleaseInfo)} />
		</div>
	) : (
		<DataTable
			table={table}
			containerClassName='!border-none pl-3.5 pb-3'
			className='!bg-transparent [&>tbody]:bg-transparent [&_tr]:!border-none [&_td]:p-0.5 [&_th]:p-0.5 [&_th]:h-8 [&_th]:!bg-transparent'
		/>
	);
}
function ReleaseSettings() {
	const { t } = useTranslation();
	const { clusterReleaseInfo, updateClusterRelease, toggleReleaseHistory } = useClusterStore();
	const user = useAuthStore((state) => state.user);
	const { toast } = useToast();
	const hasUpdate = clusterReleaseInfo?.latest?.release !== clusterReleaseInfo?.current?.release;
	const { isPending, mutateAsync } = useMutation({
		mutationFn: () =>
			updateClusterRelease({ release: clusterReleaseInfo?.latest?.release as string }),
		mutationKey: ['updateClusterRelease'],
		onSuccess: () => {
			toast({
				title: t('cluster.deploy_success') as string,
				action: 'success',
			});
		},
		onError: ({ details }: APIError) => {
			toast({
				title: details,
				action: 'error',
			});
		},
	});
	return (
		<DropdownMenuItemContainer>
			{hasUpdate && (
				<>
					<DropdownMenuItem onClick={mutateAsync} disabled={!user?.isClusterOwner}>
						<ArrowCounterClockwise className={cn('mr-2', isPending && 'animate-spin')} />
						{t('cluster.update', {
							release: clusterReleaseInfo?.latest?.release,
						})}
					</DropdownMenuItem>
					<DropdownMenuSeparator className='!m-0' />
				</>
			)}
			<DropdownMenuItem onClick={toggleReleaseHistory}>
				<ClockCounterClockwise className='mr-2' />
				{t('cluster.open_release_history')}
			</DropdownMenuItem>
			<DropdownMenuSeparator className='!m-0' />
			<DropdownMenuItem>
				<Link
					className='flex items-center'
					to={`https://github.com/cloud-agnost/agnost-community/releases/tag/${clusterReleaseInfo?.latest?.release}`}
					rel='noopener noreferrer'
					target='_blank'
				>
					<FileText className='mr-2' />
					{t('cluster.view_notes')}
				</Link>
			</DropdownMenuItem>
		</DropdownMenuItemContainer>
	);
}
